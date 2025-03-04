export default async function sendProfile(baseUrl, jsonData) {
  try {
    const response = await fetch(`${baseUrl}/api/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    alert(`Profile sent successfully!\nResponse: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    alert(`Error sending profile: ${error.message}`);
  }
}
