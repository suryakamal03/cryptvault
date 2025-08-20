import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



// http://localhost:5000 use if u want to run locally



function Dropzone({ onFileSelect, selectedFile }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFileSelect(droppedFiles[0]);
    }
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles[0]);
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.preventDefault()}
    >
      <input
        type="file"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="space-y-2">
          <div className="text-gray-500">
            {selectedFile ? (
              <p className="font-medium text-green-600">Selected: {selectedFile.name}</p>
            ) : (
              <>
                <p>Drop files here or click to browse</p>
                <p className="text-sm">Supports all file types</p>
              </>
            )}
          </div>
        </div>
      </label>
    </div>
  );
}

function App() {
  // UI States
  const [showAuth, setShowAuth] = useState(false);
  const [hasVault, setHasVault] = useState(false);

  // Create Vault States
  const [createVaultName, setCreateVaultName] = useState("");
  const [createVaultPassword, setCreateVaultPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Login Vault States
  const [loginVaultName, setLoginVaultName] = useState("");
  const [loginVaultPassword, setLoginVaultPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  // File States
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const username = localStorage.getItem("username");
    if (token) {
      setIsLoggedIn(true);
      if (username) {
        setCurrentUser(username);
      }
    }
    setLoading(false);
  }, []);

  // ✅ Fetch User Files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      if (!token) {
        setFiles([]);
        return;
      }

      const res = await fetch("https://cryptvault-1.onrender.com/users/vault/files", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch files");

      const data = await res.json();
      setFiles(data.files || []);
      setError("");
    } catch (err) {
      setError(err.message);
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch files when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [isLoggedIn]);

  // ✅ Signup (Create Vault)
  async function createVault() {
    if (!createVaultName || !createVaultPassword || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (createVaultPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("https://cryptvault-1.onrender.com/auth/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Vaultname: createVaultName,
          Vaultpassword: createVaultPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("username", createVaultName);
        setCurrentUser(createVaultName);
        setCreateVaultName("");
        setCreateVaultPassword("");
        setConfirmPassword("");
        setShowAuth(false);
        setIsLoggedIn(true);
        alert("Vault created successfully!");
      } else {
        alert(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      alert("Unexpected error: " + error.message);
    }
  }

  // ✅ Login Vault
  async function openVault(vaultName, vaultPassword) {
    if (!vaultName || !vaultPassword) {
      alert("Please enter both vault name and password");
      return;
    }

    try {
      const response = await fetch("https://cryptvault-1.onrender.com/auth/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Vaultname: vaultName,
          Vaultpassword: vaultPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("username", vaultName);
        setCurrentUser(vaultName);
        setHasVault(false);
        setLoginVaultName("");
        setLoginVaultPassword("");
        setIsLoggedIn(true);
        alert("Vault opened successfully!");
      } else {
        alert(data.message || `Login failed: ${response.status}`);
      }
    } catch (error) {
      alert("Unexpected error: " + error.message);
    }
  }

  // ✅ Fixed Upload Function
  async function uploadFile() {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    if (!isLoggedIn) {
      alert("Please login to upload files");
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("userToken");
      
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("https://cryptvault-1.onrender.com/users/vault/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("File uploaded successfully!");
        setSelectedFile(null);
        // Refresh the files list
        await fetchFiles();
      } else {
        alert(data.message || `Upload failed: ${response.status}`);
      }
    } catch (error) {
      alert("Upload error: " + error.message);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  }

  // ✅ Download Function
const downloadFile = async (file) => {
  try {
    const token = localStorage.getItem("userToken");
    if (!token) return alert("Please login first");

    // Call backend route
    const res = await fetch(`https://cryptvault-1.onrender.com/users/vault/download/${file._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    // The backend sends a redirect to the signed URL
    if (res.redirected) {
      const a = document.createElement("a");
      a.href = res.url;           // redirected signed URL
      a.download = file.Filename; // optional
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Failed to download file");
    }
  } catch (err) {
    console.error("Download error:", err);
    alert("Error downloading file");
  }
};




  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    setCurrentUser("");
    setFiles([]);
    setSelectedFile(null);
    setError("");
  };

  return (
    <div className="w-screen h-screen bg-slate-50">
      {/* Header */}
      <header className="p-4 flex justify-between items-center shadow-md bg-white">
        <div className="font-bold text-2xl">CryptVault</div>

        <nav className="flex gap-3">
          <Button variant="ghost" className="font-semibold">Home</Button>
          <Button variant="ghost" className="font-semibold">Docs</Button>
        </nav>

        <div>
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{currentUser || "My Account"}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>{currentUser ? `Hello, ${currentUser}` : "Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setShowAuth(true)}>Create Vault</Button>
          )}
        </div>
      </header>

      {/* Create Vault Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md border border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Your Vault</h2>
              <button 
                onClick={() => setShowAuth(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vault Name</label>
                <input
                  type="text"
                  placeholder="Vault Name"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={createVaultName}
                  onChange={(e) => setCreateVaultName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vault Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={createVaultPassword}
                  onChange={(e) => setCreateVaultPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowAuth(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createVault} className="flex-1">
                  Create Vault
                </Button>
              </div>
            </div>
            <div className="text-center mt-3">
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setHasVault(true);
                  setShowAuth(false);
                }}
              >
                Already have a vault? Open it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {hasVault && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md border border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Login to Your Vault</h2>
              <button 
                onClick={() => setHasVault(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vault Name</label>
                <input
                  type="text"
                  placeholder="Vault Name"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={loginVaultName}
                  onChange={(e) => setLoginVaultName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vault Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={loginVaultPassword}
                  onChange={(e) => setLoginVaultPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setHasVault(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    openVault(loginVaultName, loginVaultPassword);
                  }}
                  className="flex-1"
                >
                  Login
                </Button>
              </div>
            </div>
            <div className="text-center mt-4">
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setHasVault(false);
                  setShowAuth(true);
                }}
              >
                Don't have a vault? Create one
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload + File List */}
      <main className="mt-10 max-w-4xl mx-auto px-4">
        {isLoggedIn ? (
          <>
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Upload Files</h2>
              <Dropzone 
                onFileSelect={setSelectedFile} 
                selectedFile={selectedFile}
              />
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={uploadFile} 
                  disabled={!selectedFile || uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
            </div>

            {/* Files List Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Files</h2>
                <Button 
                  variant="outline" 
                  onClick={fetchFiles}
                  disabled={loading}
                  className="text-sm"
                >
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading files...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Error: {error}</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchFiles}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No files uploaded yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Upload your first file above!</p>
                </div>
              ) : (
                <div className="space-y-3">
  {files.map((file) => (
    <div
      key={file._id}
      className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm border"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.Filename}</p>
        <p className="text-sm text-gray-500">
          Uploaded: {new Date(file.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2 ml-4">
        <button
  onClick={() => downloadFile(file)}
  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
>
  Download
</button>
      </div>
    </div>
  ))}
</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Welcome to CryptVault</h2>
            <p className="text-gray-500 mb-6">Please create a vault or login to start uploading files</p>
            <Button onClick={() => setShowAuth(true)} className="px-6 py-2">
              Get Started
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;