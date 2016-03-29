angular.module('gasvip')
    .value('catalogs', {
        improvementAreas : [
            {
                name: 'service',
                description: 'Servicio'
            },
            {
                name: 'cleaning',
                description: 'Limpieza'
            },
            {
                name: 'segurity',
                description: 'Seguridad'
            },
            {
                name: 'confidence',
                description: 'Confianza'
            },
            {
                name: 'payment_method',
                description: 'Forma de pago'
            },
            {
                name: 'billing',
                description: 'Facturación'
            },
        ]
    });
