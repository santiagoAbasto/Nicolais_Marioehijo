@include('pdf.client-order', ['order' => $order, 'logoDataUri' => $logoDataUri, 'attachment' => $attachment ?? null, 'isPdf' => false])
