import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="prose prose-lg max-w-none">
            <CardContent className="pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using BusGo's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Booking and Tickets</h2>
                <p className="text-muted-foreground mb-2">
                  All bookings are subject to availability and confirmation. Once confirmed:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>You will receive a booking confirmation via email</li>
                  <li>Tickets are non-transferable</li>
                  <li>You must present valid identification when boarding</li>
                  <li>Seat assignments are final unless changed by BusGo</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Cancellation Policy</h2>
                <p className="text-muted-foreground mb-2">
                  Cancellations must be requested through your account. Refund terms:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>80% refund if cancelled 24 hours before departure</li>
                  <li>50% refund if cancelled 12-24 hours before departure</li>
                  <li>No refund if cancelled less than 12 hours before departure</li>
                  <li>Refunds will be processed within 7-10 business days</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Passenger Responsibilities</h2>
                <p className="text-muted-foreground mb-2">
                  Passengers are expected to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Arrive at least 15 minutes before departure</li>
                  <li>Carry valid identification</li>
                  <li>Follow driver and staff instructions</li>
                  <li>Respect other passengers and property</li>
                  <li>Not carry prohibited items (weapons, illegal substances, etc.)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Luggage Policy</h2>
                <p className="text-muted-foreground">
                  Each passenger is allowed one carry-on bag and one checked bag. Additional luggage may incur extra charges. BusGo is not responsible for lost or damaged luggage unless due to our negligence.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Service Changes</h2>
                <p className="text-muted-foreground">
                  BusGo reserves the right to modify schedules, routes, or cancel services due to circumstances beyond our control (weather, mechanical issues, etc.). In such cases, we will offer alternative arrangements or full refunds.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  BusGo's liability is limited to the ticket price. We are not liable for indirect, consequential, or punitive damages resulting from service delays or cancellations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Privacy</h2>
                <p className="text-muted-foreground">
                  Your use of our services is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Modifications to Terms</h2>
                <p className="text-muted-foreground">
                  BusGo reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Continued use of our services constitutes acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these terms, please contact us at support@busgo.com or call +1 (555) 123-4567.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
