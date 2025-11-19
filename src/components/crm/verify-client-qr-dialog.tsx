'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

type VerifyClientQrDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  clientId: string;
  clientName: string;
};

export function VerifyClientQrDialog({
  isOpen,
  onOpenChange,
  clientId,
  clientName,
}: VerifyClientQrDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      // This code runs only on the client side
      const url = `${window.location.origin}/verify-identity/${clientId}`;
      setVerificationUrl(url);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`);
    }
  }, [isOpen, clientId]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificación de Identidad para Crédito</DialogTitle>
          <DialogDescription>
            El vendedor debe escanear el código QR para iniciar el proceso de verificación de identidad del cliente <span className='font-bold'>{clientName || 'Nuevo Cliente'}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
            {qrCodeUrl ? (
                <Image
                    src={qrCodeUrl}
                    alt="Código QR de verificación"
                    width={250}
                    height={250}
                    data-ai-hint="qr code"
                />
            ) : (
                <Skeleton className="h-[250px] w-[250px]" />
            )}
        </div>
        <div className='text-center text-xs text-muted-foreground break-words'>
            {verificationUrl ? `URL: ${verificationUrl}` : <Skeleton className="h-4 w-full" />}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
