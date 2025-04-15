
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import Stepper from "@/components/Stepper";
import { useReport } from "@/context/ReportContext";
import { getMockInstances, getMockRdsInstances } from "@/utils/mockData";

const steps = ["Cloud Provider", "Credentials", "Instances", "Report Type", "Generate"];

const EnterCredentials = () => {
  const navigate = useNavigate();
  const { provider, setCredentials, setInstances, setRdsInstances } = useReport();
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate("/");
  };

  const handleCheckInstances = async () => {
    // Validate inputs
    if (!accessKeyId || !secretAccessKey) {
      setError("Access Key ID and Secret Access Key are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real application, this would be an API call to validate credentials
      // For now, we'll simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store credentials
      setCredentials({
        accessKeyId,
        secretAccessKey,
        accountId: accountId || undefined
      });
      
      // Load mock instances based on provider
      if (provider) {
        setInstances(getMockInstances(provider));
        setRdsInstances(getMockRdsInstances(provider));
        navigate("/instances");
      } else {
        throw new Error("No cloud provider selected");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!provider) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Stepper steps={steps} currentStep={1} />
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Enter Cloud Credentials</CardTitle>
            <CardDescription>
              {provider === "aws" 
                ? "Enter your AWS credentials to access your cloud resources" 
                : "Enter your Azure credentials to access your cloud resources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {provider === "aws" ? "AWS Access Key ID" : "Azure Client ID"}
                </label>
                <Input
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder={provider === "aws" ? "AKIAIOSFODNN7EXAMPLE" : "Azure Client ID"}
                  className="focus-visible:ring-nubinix-blue"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {provider === "aws" ? "AWS Secret Access Key" : "Azure Client Secret"}
                </label>
                <Input
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="●●●●●●●●●●●●●●●●●●●●"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {provider === "aws" ? "AWS Account ID (Optional)" : "Azure Tenant ID (Optional)"}
                </label>
                <Input
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder={provider === "aws" ? "123456789012" : "Azure Tenant ID"}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
            <Button 
              onClick={handleCheckInstances} 
              disabled={isLoading}
              className="bg-gradient-to-r from-nubinix-blue to-nubinix-purple hover:from-nubinix-purple hover:to-nubinix-pink"
            >
              {isLoading ? "Checking..." : "Check Instances"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default EnterCredentials;
