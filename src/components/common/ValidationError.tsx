
interface ValidationErrorProps {
  message?: string;
  id?: string;
}

export const ValidationError = ({ message, id }: ValidationErrorProps) => {
  if (!message) return null;

  return (
    <p id={id} className="text-sm text-red-600 mt-1" role="alert">
      {message}
    </p>
  );
};
