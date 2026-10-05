import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { receiptsApi } from '../../api/receipts';
import { toast } from 'sonner';

interface ThermalPrintButtonProps {
  billId: string;
  width?: 58 | 80;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  label?: string;
}

export const ThermalPrintButton: React.FC<ThermalPrintButtonProps> = ({
  billId,
  width = 58,
  className = '',
  variant = 'primary',
  label = 'Print',
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const data = await receiptsApi.getThermalReceipt(billId, width);
      
      // Decode base64 -> Uint8Array
      const binaryString = atob(data.payload);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Check Web Bluetooth support
      const nav = navigator as any;
      if (!nav.bluetooth) {
        toast.info('Bluetooth printing not supported on this device/browser. Receipt simulated successfully.');
        setIsPrinting(false);
        return;
      }

      try {
        toast.loading('Searching for Bluetooth printer...', { id: 'bt-print' });
        const device = await nav.bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
        });

        if (device && device.id) {
          localStorage.setItem('billify.printer.deviceId', device.id);
        }

        const server = await device.gatt?.connect();
        const service = await server?.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service?.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

        if (characteristic) {
          await characteristic.writeValue(bytes);
          toast.success('Receipt sent to printer!', { id: 'bt-print' });
        } else {
          toast.success('Printer connected. Ready for ESC/POS output.', { id: 'bt-print' });
        }
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
          toast.dismiss('bt-print');
        } else {
          toast.error('Printer connection failed: ' + (err.message || 'Unknown error'), { id: 'bt-print' });
        }
      }
    } catch {
      toast.error('Failed to generate thermal receipt');
    } finally {
      setIsPrinting(false);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-button text-xs transition-colors duration-150 disabled:opacity-50 select-none';
  const variantStyles =
    variant === 'primary'
      ? 'bg-primary hover:bg-primary-hover text-white shadow-sm px-4 py-2'
      : variant === 'outline'
      ? 'border border-border bg-card text-text-primary hover:bg-app-bg px-3 py-1.5'
      : 'bg-app-bg border border-border hover:opacity-80 text-text-primary px-3 py-1.5';

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isPrinting}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {isPrinting ? (
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
      ) : (
        <Printer className="w-3.5 h-3.5 mr-1.5" />
      )}
      <span>{isPrinting ? 'Printing...' : label}</span>
    </button>
  );
};
