import { CheckIcon, XIcon } from "@/components/icons";

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

export const Toast = ({ message, type, show }: ToastProps) => {
  if (!show || !message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-white ${
        type === 'success'
          ? 'bg-green-600'
          : 'bg-red-600'
      }`}>
        {type === 'success' ? <CheckIcon /> : <XIcon />}
        <span>{message}</span>
      </div>
    </div>
  );
};