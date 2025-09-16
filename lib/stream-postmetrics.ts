const postData = async (url: string, body: object, token: string) => {
    if (!token) {
  console.warn("⚠️ No token available, aborting metrics post");
  return;
}
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ POST ${url} failed [${res.status}]`, errText);
    } else {
      console.log(`✅ POST ${url}`, body);
    }
  } catch (err) {
    console.error(`❌ Network error POST ${url}`, err);
  }
};

export const streamPostMetrics = async (
  API_BASE_URL: string,
  token: string,
  deviceId: number,
  unixTimestamp: number,
  {
    batteryVoltage,
    temperature,
    accel,
    frequencies,
    amplitudes,
  }: {
    batteryVoltage?: number;
    temperature?: number;
    accel?: { x: number; y: number; z: number };
    frequencies?: { freq1: number; freq2: number; freq3: number; freq4: number };
    amplitudes?: { ampl1: number; ampl2: number; ampl3: number; ampl4: number };
  }
) => {
  if (!token) {
    console.warn("⚠️ No token available, skipping stream metrics");
    return;
  }

  // --- update latest values (PATCH endpoint) ---
  try {
    await fetch(`${API_BASE_URL}/api/device/update-latest`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deviceId,
        temperature,
        voltage: batteryVoltage,
        lastReceivedTimestamp: unixTimestamp,
        accelX: accel?.x,
        accelY: accel?.y,
        accelZ: accel?.z,
        freq1: frequencies?.freq1,
        freq2: frequencies?.freq2,
        freq3: frequencies?.freq3,
        freq4: frequencies?.freq4,
        ampl1: amplitudes?.ampl1,
        ampl2: amplitudes?.ampl2,
        ampl3: amplitudes?.ampl3,
        ampl4: amplitudes?.ampl4,
      }),
    });
  } catch (err) {
    console.error("❌ Failed to PATCH update-latest", err);
  }

  // --- historical endpoints ---
  if (!isNaN(batteryVoltage!)) {
    await postData(`${API_BASE_URL}/api/voltage`, { deviceId, voltage: batteryVoltage, timestamp: unixTimestamp }, token);
  }
  if (!isNaN(temperature!)) {
    await postData(`${API_BASE_URL}/api/temperature`, { deviceId, temperature, timestamp: unixTimestamp }, token);
  }
  if (accel && !isNaN(accel.x) && !isNaN(accel.y) && !isNaN(accel.z)) {
    await postData(`${API_BASE_URL}/api/accelerometer`, { deviceId, ...accel, timestamp: unixTimestamp }, token);
  }
  if (frequencies && !isNaN(frequencies.freq1)) {
    await postData(`${API_BASE_URL}/api/frequency`, { deviceId, ...frequencies, timestamp: unixTimestamp }, token);
  }
  if (amplitudes && !isNaN(amplitudes.ampl1)) {
    await postData(`${API_BASE_URL}/api/amplitude`, { deviceId, ...amplitudes, timestamp: unixTimestamp }, token);
  }
};