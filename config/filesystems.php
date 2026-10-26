<?php

/*
| Las proformas contienen datos personales (DNI, celular). Por eso se
| guardan en el disco "local", que vive fuera de /public y solo se entrega
| a traves de una ruta que verifica el enlace o el permiso del usuario.
*/
return [
    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => false,
        ],
    ],

    'links' => [],
];
