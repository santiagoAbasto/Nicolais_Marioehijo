<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientPaymentSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_title',
        'bank_details',
        'terms_title',
        'terms_details',
        'receipt_note',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'bank_title' => 'Cuentas bancarias para efectuar el depósito:',
            'bank_details' => implode("\n", [
                'Titular: Nicolais Mario e Hijo',
                'Banco: Banco Nación',
                'Tipo de cuenta: Cuenta Corriente',
                'Número de cuenta: 011-345678/9',
                'CBU: 01105995-55001234567890',
                'Alias: Nicolais.mario.e.hijo',
                'CUIT: 30-12345678-9',
            ]),
            'terms_title' => 'Condiciones de pago vigentes a abril 2026',
            'terms_details' => 'Pago hasta 10 días fecha factura: Descuento de 7%',
            'receipt_note' => 'Nota: Adjuntar documentos de comprobantes de transferencias, comprobantes de retenciones y/o órdenes de pagos.',
        ]);
    }
}
