"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, User, Database, Shield } from "lucide-react"
import { toast } from "sonner"
import { userProfileAPI } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import BackupRestore from "@/components/backup-restore"
import LoadingSpinner from "@/components/loading-spinner"

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await userProfileAPI.get()
      setProfile(response.data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      await userProfileAPI.update(profile)
      toast.success("Profile settings saved successfully!")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <LoadingSpinner size="lg" text="Loading settings..." className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your FinanceFlow Pro preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Configure your financial goals and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyIncomeGoal">Monthly Income Goal (PKR)</Label>
                        <Input
                          id="monthlyIncomeGoal"
                          type="number"
                          value={profile.monthlyIncomeGoal}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              monthlyIncomeGoal: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="savingsTarget">Savings Target (PKR)</Label>
                        <Input
                          id="savingsTarget"
                          type="number"
                          value={profile.savingsTarget}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              savingsTarget: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                      <Input
                        id="preferredCurrency"
                        value={profile.preferredCurrency}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            preferredCurrency: e.target.value,
                          })
                        }
                        disabled
                      />
                      <p className="text-sm text-gray-500">Currency is currently fixed to PKR</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="motivationalQuotes">Motivational Quotes</Label>
                        <p className="text-sm text-gray-500">Show motivational quotes on the dashboard</p>
                      </div>
                      <Switch
                        id="motivationalQuotes"
                        checked={profile.motivationalQuotesPreference}
                        onCheckedChange={(checked) =>
                          setProfile({
                            ...profile,
                            motivationalQuotesPreference: checked,
                          })
                        }
                      />
                    </div>

                    <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                      {saving ? "Saving..." : "Save Profile Settings"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Backup and restore your financial data</CardDescription>
              </CardHeader>
              <CardContent>
                <BackupRestore />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and privacy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-900">Data Privacy</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your financial data is stored securely and is only accessible by you. We do not share your data
                      with third parties.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium text-green-900">Data Encryption</h4>
                    <p className="text-sm text-green-700 mt-1">
                      All data is encrypted in transit and at rest using industry-standard encryption protocols.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="font-medium text-yellow-900">Regular Backups</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      We recommend creating regular backups of your data using the backup feature above.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
