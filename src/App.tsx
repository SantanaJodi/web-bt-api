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
				acceptAllDevices: true,
				optionalServices: [0xffe0],
			});

			setDeviceName(device.name || "Unknown printer");

			if (!device.gatt) {
				throw new Error("Device tidak punya GATT server");
			}

			const server = await device.gatt.connect();
			const service = await server.getPrimaryService(0xffe0);
			const characteristic = await service.getCharacteristic(0xffe1);

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
		try {
			const encoder = new TextEncoder();
			const data = encoder.encode("Halo dari React PWA!\n\n");
			await printerCharacteristic.writeValue(data);
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
