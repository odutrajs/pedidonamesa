import QRCode from 'qrcode';

const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: 'M',
};

export async function generateQrDataUrl(text: string, size = 256) {
  return QRCode.toDataURL(text, { ...QR_OPTIONS, width: size });
}

export function getTableQrFilename(number: number, label?: string | null) {
  const slug = label
    ? label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    : '';

  return slug ? `mesa-${number}-${slug}.png` : `mesa-${number}.png`;
}

export async function downloadTableQrCode(options: {
  url: string;
  number: number;
  label?: string | null;
}) {
  const dataUrl = await QRCode.toDataURL(options.url, QR_OPTIONS);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = getTableQrFilename(options.number, options.label);
  link.click();
}
