import { toast } from "@/components/ui/use-toast";

export const toastSuccess = (msg: string) =>
    toast({
        title: "Berhasil ✔",
        description: msg,
        className: "border-emerald-300 bg-emerald-50 text-emerald-900",
    });

export const toastError = (msg: string) =>
    toast({
        title: "Gagal ✖",
        description: msg,
        className: "border-red-300 bg-red-50 text-red-900",
    });

export const toastInfo = (msg: string) =>
    toast({
        title: "Info",
        description: msg,
        className: "border-indigo-300 bg-indigo-50 text-indigo-900",
    });
