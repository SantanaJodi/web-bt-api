import { useState } from "react";

function App() {
	const [deviceName, setDeviceName] = useState<string | null>(null);
	const [status, setStatus] = useState<string>("Belum terhubung");
	const [printerCharacteristic, setPrinterCharacteristic] =
		useState<BluetoothRemoteGATTCharacteristic | null>(null);

	const connectPrinter = async (): Promise<void> => {
		try {
			setStatus("Mencari printer...");

			const device = await navigator.bluetooth.requestDevice({
				filters: [
					{
						services: ["000018f0-0000-1000-8000-00805f9b34fb"],
					},
				],
			});

			setDeviceName(device.name || "Unknown printer");

			if (!device.gatt) {
				throw new Error("Device tidak punya GATT server");
			}

			const server = await device.gatt.connect();
			const service = await server.getPrimaryService(
				"000018f0-0000-1000-8000-00805f9b34fb"
			);
			const characteristic = await service.getCharacteristic(
				"00002af1-0000-1000-8000-00805f9b34fb"
			);

			setPrinterCharacteristic(characteristic);
			setStatus("Printer terhubung ✔️");
		} catch (error) {
			console.error("Gagal konek:", error);
			setStatus("Gagal konek ❌");
		}
	};

	const printText = async (): Promise<void> => {
		if (!printerCharacteristic) {
			alert("Belum terhubung ke printer!");
			return;
		}

		const textEncoder = new TextEncoder();
		const data = [
			// Inisialisasi printer
			...textEncoder.encode("\x1B\x40"),

			// Perataan tengah
			...textEncoder.encode("\x1B\x61\x01"),

			// Cetak teks dengan ukuran dobel
			...textEncoder.encode("\x1B\x21\x30"), // Bold + Double Height + Double Width
			...textEncoder.encode("TOKO MAJU JAYA\n"),

			// Atur ulang ukuran teks
			...textEncoder.encode("\x1B\x21\x00"),
			...textEncoder.encode("Jl. Merdeka No. 123, Jakarta\n\n"),

			// Perataan kiri
			...textEncoder.encode("\x1B\x61\x00"),
			...textEncoder.encode("--------------------------------\n"),
			...textEncoder.encode("Item              Qty    Harga\n"),
			...textEncoder.encode("--------------------------------\n"),

			// Contoh item
			...textEncoder.encode("Pensil            2      2.000\n"),
			...textEncoder.encode("Buku Tulis        5      15.000\n"),
			...textEncoder.encode("Penghapus         1      1.000\n"),
			...textEncoder.encode("--------------------------------\n"),

			...textEncoder.encode("\x1B\x61\x02"), // Perataan kanan
			...textEncoder.encode("Total: Rp 18.000\n\n"),

			// QRCode
			...textEncoder.encode("\x1D\x28\x6B\x04\x00\x31\x41\x32\x00"), // Atur ukuran QR code
			...textEncoder.encode("\x1D\x28\x6B\x03\x00\x31\x43\x00"), // Atur error correction
			...textEncoder.encode(
				"\x1D\x28\x6B\x11\x00\x31\x50\x30" + "www.google.com"
			), // data QR code
			...textEncoder.encode("\x1D\x28\x6B\x03\x00\x31\x51\x30"), // Cetak QR code
			...textEncoder.encode("\n\n\n"),

			// Pesan terima kasih
			...textEncoder.encode("\x1B\x61\x01"), // Perataan tengah
			...textEncoder.encode("Terima Kasih!\n"),
			...textEncoder.encode("Silahkan Datang Kembali\n\n"),

			// Perintah potong kertas
			...textEncoder.encode("\x1D\x56\x42"), // GS V B (full cut)
		];

		try {
			// Kirim data ke characteristic
			// Memeriksa apakah characteristic dapat ditulis
			if (!printerCharacteristic.properties.write) {
				console.error("Characteristic tidak dapat ditulis.");
				return;
			}

			const chunk_size = 20; // Ukuran chunk data. Biasanya 20 byte untuk BLE
			for (let i = 0; i < data.length; i += chunk_size) {
				const chunk = data.slice(i, i + chunk_size);
				await printerCharacteristic.writeValue(new Uint8Array(chunk));
				console.log(`Mengirim ${chunk.length} byte...`);

				// Beri sedikit jeda agar printer bisa memproses data (opsional, tapi disarankan)
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			setStatus("Sukses print ✅");
		} catch (error) {
			console.error("Gagal print:", error);
			setStatus("Gagal print ❌");
		}
	};

	return (
		<div style={{ padding: 20, fontFamily: "sans-serif" }}>
			<h1>React + Web Bluetooth ESC/POS</h1>
			<p>Status: {status}</p>
			<p>Device: {deviceName || "-"}</p>

			<button onClick={connectPrinter} style={{ marginRight: 10 }}>
				Connect Printer
			</button>
			<button onClick={printText} disabled={!printerCharacteristic}>
				Print Text
			</button>
		</div>
	);
}

export default App;
