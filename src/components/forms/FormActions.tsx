
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/common/LoadingButton';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
}

export const FormActions = ({
  onCancel,
  isSubmitting,
  isValid,
  isDirty,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  showCancel = true
}: FormActionsProps) => {
  return (
    <div className="flex justify-end gap-3 pt-6 border-t">
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <LoadingButton
        type="submit"
        loading={isSubmitting}
        disabled={!isValid || !isDirty || isSubmitting}
        className="min-w-[120px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          submitLabel
        )}
      </LoadingButton>
    </div>
  );
};
