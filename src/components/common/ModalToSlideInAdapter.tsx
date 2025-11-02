import { ReactNode } from 'react';
import { SlideInPanel, SlideInPanelHeader, SlideInPanelFooter } from './SlideInPanel';

interface ModalToSlideInAdapterProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  from?: 'left' | 'right';
}

export function ModalToSlideInAdapter({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = '800px',
  from = 'right'
}: ModalToSlideInAdapterProps) {
  return (
    <SlideInPanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      from={from}
      width={width}
    >
      {(subtitle || icon) && (
        <SlideInPanelHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
        />
      )}

      <div className="space-y-6">
        {children}
      </div>

      {footer && (
        <SlideInPanelFooter>
          {footer}
        </SlideInPanelFooter>
      )}
    </SlideInPanel>
  );
}

export function convertModalPropsToSlideIn(modalProps: any) {
  return {
    isOpen: modalProps.isOpen || modalProps.open,
    onClose: modalProps.onClose || modalProps.onCancel,
    title: modalProps.title,
    subtitle: modalProps.subtitle || modalProps.description,
    icon: modalProps.icon,
    width: modalProps.width || '800px',
    from: 'right' as const
  };
}
