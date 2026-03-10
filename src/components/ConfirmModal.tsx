import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, XCircle, RotateCcw, LucideIcon } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconBg: 'bg-error/10 border-error/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    iconColor: 'text-error',
    buttonClass: 'bg-error hover:bg-error/90 shadow-xl shadow-error/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    iconColor: 'text-orange-400',
    buttonClass: 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20',
  },
  info: {
    icon: AlertTriangle,
    iconBg: 'bg-primary/10 border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.15)]',
    iconColor: 'text-primary',
    buttonClass: 'bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon: CustomIcon,
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const IconComponent = CustomIcon || config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Icon + Message */}
        <div className="flex flex-col items-center text-center py-2">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 border ${config.iconBg}`}>
            <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
          </div>
          <p className="text-sm text-white font-bold max-w-xs mb-1">
            {message}
          </p>
          {description && (
            <p className="text-xs text-[#808080] max-w-xs mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
            className="font-black text-[10px] uppercase tracking-widest h-12 rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
            className={`font-black text-[10px] uppercase tracking-widest h-12 rounded-xl ${config.buttonClass}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
