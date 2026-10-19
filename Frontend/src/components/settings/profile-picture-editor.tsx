import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { Spinner } from "../ui/spinner";

interface ProfilePictureEditorProps {
    open: boolean;
    onClose: () => void;
    onSave: (blob: Blob) => void;
    onSetUrl: (url: string) => void;
}

export default function ProfilePictureEditor({
    open,
    onClose,
    onSave,
    onSetUrl,
}: ProfilePictureEditorProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    function loadImage(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        };
        reader.readAsDataURL(file);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) loadImage(file);
    }

    function handlePaste(e: React.ClipboardEvent) {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) loadImage(file);
                e.preventDefault();
                return;
            }
        }
    }

    async function handleCropSave() {
        if (!imageSrc || !croppedAreaPixels) return;
        setSaving(true);
        try {
            const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
            onSave(blob);
            handleReset();
        } finally {
            setSaving(false);
        }
    }

    function handleUrlSave() {
        if (!urlInput.trim()) return;
        onSetUrl(urlInput.trim());
        setUrlInput("");
        onClose();
    }

    function handleReset() {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleReset()}>
            <DialogContent className="sm:max-w-md" onPaste={handlePaste}>
                <DialogHeader>
                    <DialogTitle>{t("profilePicture.dialogTitle")}</DialogTitle>
                </DialogHeader>

                {imageSrc ? (
                    <div className="space-y-4">
                        <div className="relative w-full h-64">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setImageSrc(null)}>
                                {t("common.back")}
                            </Button>
                            <Button onClick={handleCropSave} disabled={saving}>
                                {saving ? <Spinner /> : t("common.save")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Tabs defaultValue="upload">
                        <TabsList className="w-full">
                            <TabsTrigger value="upload" className="flex-1">{t("profilePicture.uploadTab")}</TabsTrigger>
                            <TabsTrigger value="url" className="flex-1">{t("profilePicture.urlTab")}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="space-y-4 pt-2">
                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <p className="text-muted-foreground text-sm">
                                    {t("profilePicture.uploadHint")}
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="url" className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="pfp-url">{t("profilePicture.imageUrl")}</Label>
                                <Input
                                    id="pfp-url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder={t("profilePicture.urlPlaceholder")}
                                />
                            </div>
                            <Button onClick={handleUrlSave} disabled={!urlInput.trim()} className="w-full">
                                {t("profilePicture.setUrl")}
                            </Button>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
            "image/png",
        );
    });
}
