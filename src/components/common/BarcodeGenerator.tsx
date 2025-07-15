import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BarcodeGeneratorProps {
  onBarcodeGenerated: (barcode: string) => void;
  disabled?: boolean;
}

export const BarcodeGenerator = ({ onBarcodeGenerated, disabled = false }: BarcodeGeneratorProps) => {
  const [generatedBarcode, setGeneratedBarcode] = useState<string>('');

  const generateBarcode = () => {
    // Générer un code barre EAN-13 (13 chiffres)
    const prefix = '6'; // Préfixe pour l'Afrique de l'Ouest
    const middle = Math.floor(Math.random() * 90000000) + 10000000; // 8 chiffres
    const checkDigit = calculateCheckDigit(prefix + middle.toString());
    const barcode = prefix + middle.toString() + checkDigit;
    
    setGeneratedBarcode(barcode);
    onBarcodeGenerated(barcode);
  };

  const calculateCheckDigit = (code: string): string => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i]);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const remainder = sum % 10;
    return remainder === 0 ? '0' : (10 - remainder).toString();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedBarcode);
      toast({
        title: "Code barre copié",
        description: "Le code barre a été copié dans le presse-papiers.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code barre.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Générateur de code barre</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateBarcode}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Générer
          </Button>
          
          {generatedBarcode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copier
            </Button>
          )}
        </div>

        {generatedBarcode && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Code barre généré:</Label>
            <div className="flex items-center gap-2">
              <Input
                value={generatedBarcode}
                readOnly
                className="font-mono text-sm"
              />
              <Badge variant="secondary" className="text-xs">
                EAN-13
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 