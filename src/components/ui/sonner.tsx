import { Toaster as Sonner } from "sonner";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      icons={{
        success: <CheckCircle size={15} strokeWidth={1.6} />,
        error: <XCircle size={15} strokeWidth={1.6} />,
        warning: <AlertTriangle size={15} strokeWidth={1.6} />,
        info: <Info size={15} strokeWidth={1.6} />,
        loading: <RefreshCw size={15} strokeWidth={1.6} className="animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast flex items-center gap-3 !bg-[rgba(13,13,15,0.92)] !text-white !border !border-white/10 !backdrop-blur-xl !rounded-xl !shadow-[0_16px_48px_rgba(0,0,0,0.55)] !px-4 !py-3",
          title: "!text-[14px] !font-normal !leading-snug",
          description: "!text-[12px] !text-white/60",
          actionButton: "!text-[12px]",
          cancelButton: "!text-[12px]",
          icon: "!text-[var(--cond)]",
        },
        style: {
          fontFamily: "'DM Sans', sans-serif",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
