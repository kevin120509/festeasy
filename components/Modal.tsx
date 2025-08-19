import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  // @ts-ignore
  const { X } = window.LucideReact || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8 relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            {X ? <X size={28} /> : <span className="text-2xl font-bold">&times;</span>}
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
