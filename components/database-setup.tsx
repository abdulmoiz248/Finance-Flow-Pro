"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import axios from "axios"

interface SetupStatus {
  connected: boolean
  setupComplete: boolean
  error?: string
  message?: string
}

export default function DatabaseSetup() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/setup")
      setStatus({
        connected: response.data.connected,
        setupComplete: false,
        message: response.data.message,
      })
    } catch (error: any) {
      setStatus({
        connected: false,
        setupComplete: false,
        error: error.response?.data?.error || "Connection test failed",
        message: error.response?.data?.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const setupDatabase = async () => {
    setSetupLoading(true)
    try {
      const response = await axios.post("/api/setup")
      setStatus({
        connected: true,
        setupComplete: true,
        message: response.data.message,
      })
    } catch (error: any) {
      setStatus({
        connected: false,
        setupComplete: false,
        error: error.response?.data?.error || "Database setup failed",
        message: error.response?.data?.message,
      })
    } finally {
      setSetupLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Set up your MongoDB database with collections and sample data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          {status && (
            <Alert className={status.connected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {status.connected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={status.connected ? "text-green-800" : "text-red-800"}>
                  {status.message || (status.connected ? "Database connected" : "Connection failed")}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Error Message */}
          {status?.error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{status.error}</AlertDescription>
            </Alert>
          )}

          {/* Setup Complete */}
          {status?.setupComplete && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Database setup completed! You can now use the application.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={checkConnection} disabled={loading} variant="outline" className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Test Connection
            </Button>

            <Button onClick={setupDatabase} disabled={setupLoading || !status?.connected} className="w-full">
              {setupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Setup Database
            </Button>

            {status?.setupComplete && (
              <Button onClick={() => (window.location.href = "/")} className="w-full bg-green-600 hover:bg-green-700">
                Go to Dashboard
              </Button>
            )}
          </div>

          {/* Connection String Help */}
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">MongoDB Connection String Format:</p>
            <code className="block p-2 bg-gray-100 rounded text-xs break-all">
              mongodb+srv://username:password@cluster.mongodb.net/financeflow?retryWrites=true&w=majority
            </code>
            <p className="text-xs">
              Make sure to replace username, password, and cluster with your actual MongoDB Atlas credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
