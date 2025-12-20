import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertCircle, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SystemSettings {
  id: string;
  booking_mode: 'offline' | 'online' | 'hybrid';
  online_payment_weekends: boolean;
  online_payment_distance_threshold: number | null;
  online_payment_disable_from: string | null;
  online_payment_disable_to: string | null;
  festival_force_online: boolean;
  use_real_payment_gateway: boolean;
  allow_mock_webhook_simulation: boolean;
  created_at: string;
  updated_at: string;
}

export default function PaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [testBookingGroupId, setTestBookingGroupId] = useState("");
  const [testAmount, setTestAmount] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data as SystemSettings);
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          booking_mode: settings.booking_mode,
          online_payment_weekends: settings.online_payment_weekends,
          online_payment_distance_threshold: settings.online_payment_distance_threshold,
          online_payment_disable_from: settings.online_payment_disable_from,
          online_payment_disable_to: settings.online_payment_disable_to,
          festival_force_online: settings.festival_force_online,
          use_real_payment_gateway: settings.use_real_payment_gateway,
          allow_mock_webhook_simulation: settings.allow_mock_webhook_simulation,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Payment rules updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load settings</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const handleTestPayment = async (outcome: 'success' | 'failure') => {
    if (!testBookingGroupId || !testAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter booking group ID and amount",
        variant: "destructive"
      });
      return;
    }

    setTestRunning(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('mockPaymentProvider/simulate-webhook', {
        body: {
          booking_group_id: testBookingGroupId,
          amount: parseFloat(testAmount),
          order_id: `test_order_${Date.now()}`,
          outcome
        }
      });

      if (error) throw error;

      setTestResult({ success: true, data, outcome });
      toast({
        title: "Test Payment Complete",
        description: `Simulated ${outcome} for ${data.bookings_confirmed || 0} bookings`,
      });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message, outcome });
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <AdminLayout>
      <Tabs defaultValue="settings" className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure booking modes, payment gateway, and test tools
          </p>
        </div>

        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="gateway">Payment Gateway</TabsTrigger>
          <TabsTrigger value="testing">Testing Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Booking Mode</CardTitle>
            <CardDescription>
              Define how customers can book tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.booking_mode}
              onValueChange={(value) =>
                setSettings({ ...settings, booking_mode: value as any })
              }
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="offline" id="offline" />
                <Label htmlFor="offline" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Offline Only</div>
                  <div className="text-sm text-muted-foreground">
                    Customers book instantly without payment (pay on bus)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Online Only</div>
                  <div className="text-sm text-muted-foreground">
                    Customers must pay online before booking confirmation
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Hybrid Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Customers can choose: Pay Online or Pay Later
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Payment Rules</CardTitle>
            <CardDescription>
              Override booking mode with rule-based conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="festival-mode" className="font-semibold">
                  Festival Mode: Force Online Payment
                </Label>
                <p className="text-sm text-muted-foreground">
                  Override all rules and require online payment for all bookings
                </p>
              </div>
              <Switch
                id="festival-mode"
                checked={settings.festival_force_online}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, festival_force_online: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="weekend-online" className="font-semibold">
                  Enable Online Payments on Weekends
                </Label>
                <p className="text-sm text-muted-foreground">
                  Force online payment for bookings on Saturday/Sunday
                </p>
              </div>
              <Switch
                id="weekend-online"
                checked={settings.online_payment_weekends}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, online_payment_weekends: checked })
                }
              />
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
              <Label htmlFor="distance-threshold" className="font-semibold">
                Distance Threshold (km)
              </Label>
              <p className="text-sm text-muted-foreground">
                Force online payment for trips exceeding this distance
              </p>
              <Input
                id="distance-threshold"
                type="number"
                placeholder="e.g., 100"
                value={settings.online_payment_distance_threshold || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    online_payment_distance_threshold: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
              />
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
              <Label className="font-semibold">
                Disable Offline Mode During Time Range
              </Label>
              <p className="text-sm text-muted-foreground">
                Force online payment during specific hours (e.g., peak hours)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disable-from" className="text-sm">From</Label>
                  <Input
                    id="disable-from"
                    type="time"
                    value={settings.online_payment_disable_from || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        online_payment_disable_from: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="disable-to" className="text-sm">To</Label>
                  <Input
                    id="disable-to"
                    type="time"
                    value={settings.online_payment_disable_to || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        online_payment_disable_to: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
        </TabsContent>

        <TabsContent value="gateway" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
              <CardDescription>
                Control which payment provider is used for online bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {settings?.use_real_payment_gateway ? (
                    <span className="text-yellow-600 font-semibold">
                      ⚠️ LIVE MODE: Real payments are being processed using Razorpay
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold">
                      ✓ TEST MODE: Mock payments are being used (no real money)
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <Label htmlFor="use-real-gateway" className="font-semibold">
                    Use Real Payment Gateway (Razorpay)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toggle OFF to use mock provider for testing (recommended during development)
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toggle ON to process real payments via Razorpay
                  </p>
                </div>
                <Switch
                  id="use-real-gateway"
                  checked={settings?.use_real_payment_gateway || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings!, use_real_payment_gateway: checked })
                  }
                />
              </div>

              {settings?.use_real_payment_gateway && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Live Payment Gateway Enabled</strong>
                    <p className="mt-2">
                      To use Razorpay, you must add the following secrets via Settings → Secrets:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><code>RAZORPAY_KEY_ID</code> - Your Razorpay Key ID</li>
                      <li><code>RAZORPAY_KEY_SECRET</code> - Your Razorpay Key Secret</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      Without these secrets, online payments will fail. Get your keys from the Razorpay Dashboard.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {!settings?.use_real_payment_gateway && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                    Mock Payment Provider Active
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    All online payments will be simulated. No real money will be processed. 
                    Perfect for development and testing your booking flows end-to-end.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="mock-webhook" className="font-semibold">
                    Allow Mock Webhook Simulation
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable admin testing tools to manually simulate payment events
                  </p>
                </div>
                <Switch
                  id="mock-webhook"
                  checked={settings?.allow_mock_webhook_simulation || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings!, allow_mock_webhook_simulation: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Gateway Settings
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Alert>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              <strong>Developer Testing Tools</strong>
              <p className="mt-1">
                Simulate payment outcomes to test your booking confirmation and ticket generation flows.
                Only works when mock provider is active (Real Payment Gateway = OFF).
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Simulate Payment Events</CardTitle>
              <CardDescription>
                Manually trigger payment success or failure for a booking group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-booking-group">Booking Group ID</Label>
                <Input
                  id="test-booking-group"
                  placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                  value={testBookingGroupId}
                  onChange={(e) => setTestBookingGroupId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-amount">Amount (₹)</Label>
                <Input
                  id="test-amount"
                  type="number"
                  placeholder="e.g., 500"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleTestPayment('success')}
                  disabled={testRunning || settings?.use_real_payment_gateway}
                  className="flex-1"
                  variant="default"
                >
                  {testRunning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Simulate Success
                </Button>

                <Button
                  onClick={() => handleTestPayment('failure')}
                  disabled={testRunning || settings?.use_real_payment_gateway}
                  className="flex-1"
                  variant="destructive"
                >
                  {testRunning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Simulate Failure
                </Button>
              </div>

              {settings?.use_real_payment_gateway && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Testing tools are disabled when Real Payment Gateway is enabled.
                    Switch to mock provider to use these tools.
                  </AlertDescription>
                </Alert>
              )}

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <strong>{testResult.outcome === 'success' ? 'Payment Success' : 'Payment Failure'} Simulated</strong>
                    <Textarea
                      className="mt-2 font-mono text-xs"
                      rows={8}
                      value={JSON.stringify(testResult, null, 2)}
                      readOnly
                    />
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Switch to Live Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Step 1: Add Razorpay Secrets</h4>
                <p className="text-muted-foreground">
                  Go to Settings → Secrets and add:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4">
                  <li><code>RAZORPAY_KEY_ID</code></li>
                  <li><code>RAZORPAY_KEY_SECRET</code></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Step 2: Enable Real Gateway</h4>
                <p className="text-muted-foreground">
                  Navigate to the "Payment Gateway" tab and toggle "Use Real Payment Gateway" to ON.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Step 3: Test with Small Amount</h4>
                <p className="text-muted-foreground">
                  Make a test booking with a small amount (e.g., ₹1) to verify the integration works correctly.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Note:</strong> Never commit API keys to code. Always use the secure Secrets system.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
