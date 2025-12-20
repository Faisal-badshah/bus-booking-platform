import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="prose prose-lg max-w-none">
            <CardContent className="pt-6 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-2">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>Payment information (processed securely by our payment partners)</li>
                  <li>Travel preferences and booking history</li>
                  <li>Communication preferences</li>
                  <li>Device and usage information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-2">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Process your bookings and provide our services</li>
                  <li>Send you booking confirmations and updates</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Improve our services and develop new features</li>
                  <li>Send you promotional communications (with your consent)</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-muted-foreground mb-2">
                  We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Service providers who assist in our operations (payment processors, hosting services)</li>
                  <li>Business partners for legitimate purposes</li>
                  <li>Law enforcement when required by law</li>
                  <li>Other parties with your consent</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Your Rights</h2>
                <p className="text-muted-foreground mb-2">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Object to processing of your information</li>
                  <li>Request data portability</li>
                  <li>Withdraw consent for marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When no longer needed, we will securely delete or anonymize your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. International Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <p className="text-muted-foreground mt-2">
                  Email: privacy@busgo.com<br />
                  Phone: +1 (555) 123-4567<br />
                  Address: 123 Transit Avenue, City Center, ST 12345
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
