# Plugin GestionAlbaranes para FacturaScripts 2025

Plugin para gestión avanzada de albaranes de cliente en FacturaScripts 2025.

## Características

### Versión 1.0
- ✅ Recalcular totales de albaranes que se importaron por API
- ✅ Detectar automáticamente albaranes con totales incorrectos
- ✅ Interfaz visual para revisar y procesar albaranes
- ✅ Log detallado de operaciones realizadas

### Próximas versiones
- 🔜 Conversión masiva de albaranes a facturas
- 🔜 Filtros avanzados por fecha, cliente, estado
- 🔜 Exportación de informes

## Instalación

1. Descarga el plugin y colócalo en la carpeta `Plugins/GestionAlbaranes/`
2. Accede a FacturaScripts como administrador
3. Ve a `Admin > Plugins`
4. Activa el plugin `GestionAlbaranes`

## Uso

### Recalcular Totales

1. Ve al menú `Ventas > Recalcular Totales Albaranes`
2. Verás un listado de albaranes con totales incorrectos (total = 0 pero con líneas)
3. Pulsa el botón "Recalcular Todos los Totales"
4. El sistema procesará todos los albaranes y mostrará el resultado

## Problema que resuelve

Cuando importas albaranes mediante API, a veces FacturaScripts no calcula automáticamente 
los totales aunque todas las líneas estén correctamente introducidas. Este plugin:

- Detecta automáticamente estos albaranes
- Recalcula los totales correctamente
- Mantiene un log de las operaciones

## Requisitos

- FacturaScripts 2025 o superior
- PHP 8.0 o superior

## Autor

Jose - 2025

## Licencia

Este plugin es propietario.
