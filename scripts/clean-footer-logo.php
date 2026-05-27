<?php

$logoPath = __DIR__.'/../storage/app/public/brand/logofo.svg';

if (! file_exists($logoPath)) {
    fwrite(STDERR, "No existe el logo: {$logoPath}\n");
    exit(1);
}

$svg = file_get_contents($logoPath);

if ($svg === false) {
    fwrite(STDERR, "No se pudo leer el logo: {$logoPath}\n");
    exit(1);
}

$updated = str_replace('fill="#1D1D1B"', 'fill="#000000"', $svg);

if ($updated === $svg) {
    echo "No se encontraron franjas #1D1D1B para limpiar.\n";
    exit(0);
}

file_put_contents($logoPath, $updated);

echo "Logo footer actualizado: franja cambiada a #000000.\n";
