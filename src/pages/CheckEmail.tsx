import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CheckEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            📩 Check your email
          </CardTitle>
          <CardDescription className="text-center">
            We’ve sent a verification link to your email.  
            Please click the link to activate your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
