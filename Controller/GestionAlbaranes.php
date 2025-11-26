<?php
/**
 * Controlador para gestionar albaranes con botones de recalcular y convertir
 * 
 * @author Jose
 */

namespace FacturaScripts\Plugins\GestionAlbaranes\Controller;

use FacturaScripts\Core\Lib\ExtendedController\ListController;
use FacturaScripts\Core\Base\Calculator;
use FacturaScripts\Core\Tools;
use FacturaScripts\Dinamic\Model\AlbaranCliente;
use FacturaScripts\Dinamic\Model\FacturaCliente;

class GestionAlbaranes extends ListController
{
    private function writeLog($message): void
    {
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logFile = $logDir . '/debug.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }

    public function privateCore(&$response, $user, $permissions): void
    {
        $this->writeLog('=== privateCore called ===');
        $this->writeLog('Request method: ' . $this->request->getMethod());

        // Capturar parámetros ANTES de que parent los limpie
        $action = null;
        $codes = [];

        if ($this->request->getMethod() === 'POST') {
            // Intentar desde $_POST directamente (más confiable)
            if (isset($_POST['action'])) {
                $action = $_POST['action'];
                $codes = isset($_POST['code']) ? (array)$_POST['code'] : [];
            }
            // Fallback a request object
            if (!$action) {
                $action = $this->request->request->get('action');
                $codes = $this->request->request->get('code', []);
            }

            $this->writeLog('POST action from $_POST: ' . ($action ?? 'NULL'));
            $this->writeLog('POST codes: ' . json_encode($codes));
        }

        // Ahora llamar al parent
        parent::privateCore($response, $user, $permissions);

        // Procesar la acción después del parent
        if ($action === 'recalcular-totales') {
            $this->writeLog('Calling recalcularTotalesAction with codes: ' . json_encode($codes));
            $this->recalcularTotalesAction($codes);
        } elseif ($action === 'convertir-facturas') {
            $this->writeLog('Calling convertirFacturasAction with codes: ' . json_encode($codes));
            $this->convertirFacturasAction($codes);
        }
    }

    public function getPageData(): array
    {
        $data = parent::getPageData();
        $data['menu'] = 'sales';
        $data['title'] = 'Gestión de Albaranes';
        $data['icon'] = 'fas fa-file-alt';
        $data['template'] = 'GestionAlbaranes';
        return $data;
    }
    
    protected function createViews()
    {
        $this->createViewAlbaranes();
    }
    
    protected function createViewAlbaranes(string $viewName = 'ListAlbaranCliente'): void
    {
        $this->addView($viewName, 'AlbaranCliente', 'delivery-notes', 'fas fa-file-alt');
        
        // Búsqueda
        $this->addSearchFields($viewName, ['codigo', 'nombrecliente', 'numero2', 'observaciones']);
        
        // Ordenación
        $this->addOrderBy($viewName, ['codigo'], 'code', 2);
        $this->addOrderBy($viewName, ['fecha', 'hora'], 'date');
        $this->addOrderBy($viewName, ['numero'], 'number');
        $this->addOrderBy($viewName, ['total'], 'amount');
        
        // Filtros
        $this->addFilterPeriod($viewName, 'date', 'period', 'fecha');
        $this->addFilterAutocomplete($viewName, 'codcliente', 'customer', 'codcliente', 'clientes', 'codcliente', 'nombre');
        $this->addFilterAutocomplete($viewName, 'codserie', 'serie', 'codserie', 'series', 'codserie', 'descripcion');
        $this->addFilterCheckbox($viewName, 'editable', 'editable', 'editable');
        
        // Botones de acción
        $this->addButton($viewName, [
            'onclick' => 'recalcularTotales()',
            'icon' => 'fas fa-calculator',
            'label' => 'Recalcular totales'
        ]);

        $this->addButton($viewName, [
            'onclick' => 'convertirFacturas()',
            'icon' => 'fas fa-file-invoice',
            'label' => 'Convertir a facturas'
        ]);
        
        // Deshabilitar creación y borrado
        $this->setSettings($viewName, 'btnNew', false);
        $this->setSettings($viewName, 'btnDelete', false);
    }
    
    private function recalcularTotalesAction(array $codes = []): bool
    {
        $this->writeLog('=== recalcularTotalesAction started ===');

        if (empty($codes)) {
            // Fallback a request en caso de que se llame sin parámetros
            $codes = $this->request->request->get('code', []);
        }
        $this->writeLog('Codes in action: ' . json_encode($codes));

        if (empty($codes)) {
            $this->writeLog('No codes provided');
            Tools::log()->warning('No hay albaranes seleccionados');
            return true;
        }

        $procesados = 0;
        $errores = 0;

        foreach ($codes as $code) {
            $this->writeLog("Processing code: $code");

            $albaran = new AlbaranCliente();
            if ($albaran->loadFromCode($code)) {
                $this->writeLog("Albaran loaded: $code");

                $lines = $albaran->getLines();
                $this->writeLog("Lines count: " . count($lines));

                if (Calculator::calculate($albaran, $lines, true)) {
                    $this->writeLog("Calculator calculated for: $code");

                    if ($albaran->save()) {
                        $this->writeLog("Albaran saved: $code");
                        $procesados++;
                    } else {
                        $this->writeLog("ERROR: Could not save albaran: $code");
                        $errores++;
                    }
                } else {
                    $this->writeLog("ERROR: Calculator failed for: $code");
                    $errores++;
                }
            } else {
                $this->writeLog("ERROR: Could not load albaran: $code");
                $errores++;
            }
        }

        $this->writeLog("Recalcular finished - Procesados: $procesados, Errores: $errores");

        if ($procesados > 0) {
            Tools::log()->notice("Recalculados $procesados albaranes correctamente");
        }

        if ($errores > 0) {
            Tools::log()->warning("Errores al procesar $errores albaranes");
        }

        return true;
    }
    
    private function convertirFacturasAction(array $codes = []): bool
    {
        $this->writeLog('=== convertirFacturasAction started ===');

        if (empty($codes)) {
            // Fallback a request en caso de que se llame sin parámetros
            $codes = $this->request->request->get('code', []);
        }
        $this->writeLog('Codes in action: ' . json_encode($codes));

        if (empty($codes)) {
            $this->writeLog('No codes provided');
            Tools::log()->warning('No hay albaranes seleccionados');
            return true;
        }

        $procesados = 0;
        $errores = 0;
        
        foreach ($codes as $code) {
            $albaran = new AlbaranCliente();
            
            if (!$albaran->loadFromCode($code)) {
                $errores++;
                continue;
            }
            
            // Verificar si el albarán es editable (si no, ya está facturado)
            if (!$albaran->editable) {
                continue;
            }
            
            // Obtener la última factura de esta serie
            $sql = "SELECT codigo, fecha, hora, numero 
                    FROM facturascli 
                    WHERE codserie = " . $this->dataBase->var2str($albaran->codserie) . "
                    ORDER BY numero DESC, fecha DESC, hora DESC 
                    LIMIT 1";
            
            $result = $this->dataBase->select($sql);
            $ultimaFactura = !empty($result) ? $result[0] : null;
            
            $fechaFactura = $albaran->fecha;
            $horaFactura = $albaran->hora;
            
            // Si hay factura anterior y la fecha del albarán es anterior o igual
            if ($ultimaFactura) {
                $fechaUltimaFactura = strtotime($ultimaFactura['fecha']);
                $fechaAlbaran = strtotime($albaran->fecha);
                
                if ($fechaAlbaran <= $fechaUltimaFactura) {
                    // Usar MISMA fecha que última factura
                    $fechaFactura = $ultimaFactura['fecha'];
                    
                    // Si tienen hora, sumar 1 minuto
                    if (!empty($albaran->hora) && !empty($ultimaFactura['hora'])) {
                        $horaFactura = date('H:i:s', strtotime($ultimaFactura['hora'] . ' +1 minute'));
                    } else {
                        $horaFactura = !empty($albaran->hora) ? $albaran->hora : date('H:i:s');
                    }
                }
            }
            
            // Generar la factura
            $factura = new FacturaCliente();
            
            // Copiar datos del albarán
            $factura->codalmacen = $albaran->codalmacen;
            $factura->codcliente = $albaran->codcliente;
            $factura->coddivisa = $albaran->coddivisa;
            $factura->codpago = $albaran->codpago;
            $factura->codserie = $albaran->codserie;
            $factura->fecha = $fechaFactura;
            $factura->hora = $horaFactura;
            $factura->nombrecliente = $albaran->nombrecliente;
            $factura->observaciones = $albaran->observaciones;
            $factura->cifnif = $albaran->cifnif;
            $factura->codpais = $albaran->codpais;
            $factura->provincia = $albaran->provincia;
            $factura->ciudad = $albaran->ciudad;
            $factura->direccion = $albaran->direccion;
            $factura->codpostal = $albaran->codpostal;
            
            if (!$factura->save()) {
                $errores++;
                continue;
            }
            
            // Copiar líneas
            $lineasAlbaran = $albaran->getLines();
            $errorLineas = false;
            
            foreach ($lineasAlbaran as $lineaAlbaran) {
                $lineaFactura = $factura->getNewLine();
                $lineaFactura->actualizastock = $lineaAlbaran->actualizastock;
                $lineaFactura->cantidad = $lineaAlbaran->cantidad;
                $lineaFactura->codimpuesto = $lineaAlbaran->codimpuesto;
                $lineaFactura->descripcion = $lineaAlbaran->descripcion;
                $lineaFactura->dtopor = $lineaAlbaran->dtopor;
                $lineaFactura->dtopor2 = $lineaAlbaran->dtopor2;
                $lineaFactura->idproducto = $lineaAlbaran->idproducto;
                $lineaFactura->iva = $lineaAlbaran->iva;
                $lineaFactura->pvpunitario = $lineaAlbaran->pvpunitario;
                $lineaFactura->recargo = $lineaAlbaran->recargo;
                $lineaFactura->referencia = $lineaAlbaran->referencia;
                
                if (!$lineaFactura->save()) {
                    $errorLineas = true;
                    break;
                }
            }
            
            if ($errorLineas) {
                $factura->delete();
                $errores++;
                continue;
            }
            
            // Recalcular totales de la factura
            $lineasFactura = $factura->getLines();
            Calculator::calculate($factura, $lineasFactura, true);
            
            $procesados++;
        }

        $this->writeLog("Convertir finished - Procesados: $procesados, Errores: $errores");

        if ($procesados > 0) {
            Tools::log()->notice("Creadas $procesados facturas correctamente");
        }

        if ($errores > 0) {
            Tools::log()->warning("Errores al procesar $errores albaranes");
        }

        return true;
    }
}
