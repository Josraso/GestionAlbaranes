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
    public function getPageData(): array
    {
        $data = parent::getPageData();
        $data['menu'] = 'sales';
        $data['title'] = 'Gestión de Albaranes';
        $data['icon'] = 'fas fa-file-alt';
        $data['js'] = 'GestionAlbaranes';
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
            'action' => 'recalcularTotales()',
            'icon' => 'fas fa-calculator',
            'label' => 'Recalcular totales',
            'type' => 'js'
        ]);
        
        $this->addButton($viewName, [
            'action' => 'convertirFacturas()',
            'icon' => 'fas fa-file-invoice',
            'label' => 'Convertir a facturas',
            'type' => 'js'
        ]);
        
        // Deshabilitar creación y borrado
        $this->setSettings($viewName, 'btnNew', false);
        $this->setSettings($viewName, 'btnDelete', false);
    }
    
    protected function execPreviousAction($action)
    {
        switch ($action) {
            case 'recalcular-totales':
                return $this->recalcularTotalesAction();
                
            case 'convertir-facturas':
                return $this->convertirFacturasAction();
        }
        
        return parent::execPreviousAction($action);
    }
    
    private function recalcularTotalesAction(): bool
    {
        $codes = $this->request->request->get('code', []);
        
        if (empty($codes)) {
            Tools::log()->warning('No hay albaranes seleccionados');
            return true;
        }
        
        $procesados = 0;
        
        foreach ($codes as $code) {
            $albaran = new AlbaranCliente();
            if ($albaran->loadFromCode($code)) {
                $lines = $albaran->getLines();
                if (Calculator::calculate($albaran, $lines, true)) {
                    $procesados++;
                }
            }
        }
        
        if ($procesados > 0) {
            Tools::log()->notice("Recalculados $procesados albaranes correctamente");
        }
        
        return true;
    }
    
    private function convertirFacturasAction(): bool
    {
        $codes = $this->request->request->get('code', []);
        
        if (empty($codes)) {
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
        
        if ($procesados > 0) {
            Tools::log()->notice("Creadas $procesados facturas correctamente");
        }
        
        if ($errores > 0) {
            Tools::log()->warning("Errores al procesar $errores albaranes");
        }
        
        return true;
    }
}
