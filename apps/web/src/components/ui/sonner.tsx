import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 stroke-[3]" />,
        info: <InfoIcon className="size-5 stroke-[3]" />,
        warning: <TriangleAlertIcon className="size-5 stroke-[3]" />,
        error: <OctagonXIcon className="size-5 stroke-[3]" />,
        loading: <Loader2Icon className="size-5 stroke-[3] animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast flex items-center gap-3 w-full p-4 font-mono font-bold border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 text-black dark:text-white rounded-md mb-4",
          title: "text-sm font-black uppercase tracking-tight",
          description: "group-[.toast]:text-black dark:group-[.toast]:text-white group-[.toast]:font-normal group-[.toast]:opacity-70 text-xs",
          actionButton:
            "group-[.toast]:bg-yellow-300 dark:group-[.toast]:bg-yellow-600 group-[.toast]:text-black dark:group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:border-2 group-[.toast]:border-black dark:group-[.toast]:border-white group-[.toast]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:group-[.toast]:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] group-[.toast]:active:translate-x-[1px] group-[.toast]:active:translate-y-[1px] group-[.toast]:active:shadow-none group-[.toast]:transition-all group-[.toast]:rounded-md group-[.toast]:uppercase group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-stone-500 dark:group-[.toast]:bg-stone-700 group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:border-2 group-[.toast]:border-black dark:group-[.toast]:border-white group-[.toast]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:group-[.toast]:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] group-[.toast]:active:translate-x-[1px] group-[.toast]:active:translate-y-[1px] group-[.toast]:active:shadow-none group-[.toast]:transition-all group-[.toast]:rounded-md group-[.toast]:uppercase group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5",
          error: "group-[.toast]:bg-red-600 dark:group-[.toast]:bg-red-800 group-[.toast]:text-white",
          success: "group-[.toast]:bg-yellow-300 dark:group-[.toast]:bg-yellow-600 group-[.toast]:text-black dark:group-[.toast]:text-white",
          warning: "group-[.toast]:bg-yellow-400 dark:group-[.toast]:bg-yellow-700 group-[.toast]:text-black dark:group-[.toast]:text-white",
          info: "group-[.toast]:bg-white dark:group-[.toast]:bg-zinc-800 group-[.toast]:text-black dark:group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }