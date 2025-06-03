"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Upload, Database, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const response = await axios.get("/api/backup", { responseType: "blob" })

      // Create download link
      const blob = new Blob([response.data], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `financeflow-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Backup created and downloaded successfully!")
    } catch (error) {
      console.error("Backup error:", error)
      toast.error("Failed to create backup")
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    try {
      const fileContent = await file.text()
      const backupData = JSON.parse(fileContent)

      const response = await axios.post("/api/backup", backupData)

      toast.success(
        `Data restored successfully! ${response.data.restored.transactions} transactions and ${response.data.restored.mutualFunds} mutual funds restored.`,
      )

      // Refresh the page to show restored data
      window.location.reload()
    } catch (error) {
      console.error("Restore error:", error)
      toast.error("Failed to restore backup. Please check the file format.")
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Backup Data
          </CardTitle>
          <CardDescription>
            Download a complete backup of your financial data including transactions and mutual funds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBackup} disabled={isBackingUp} className="w-full">
            {isBackingUp ? (
              <>
                <Database className="mr-2 h-4 w-4 animate-pulse" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-600" />
            Restore Data
          </CardTitle>
          <CardDescription>
            Upload a backup file to restore your financial data. This will replace all existing data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">This will replace all existing data!</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-file">Select Backup File</Label>
            <Input id="backup-file" type="file" accept=".json" onChange={handleRestore} disabled={isRestoring} />
          </div>

          {isRestoring && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Database className="h-4 w-4 animate-pulse" />
              Restoring data...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
