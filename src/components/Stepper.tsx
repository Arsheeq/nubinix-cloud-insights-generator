
import React from "react";
import { cn } from "@/lib/utils";

interface StepProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium", 
                  index < currentStep 
                    ? "bg-blue-600" 
                    : index === currentStep 
                    ? "bg-blue-500" 
                    : "bg-gray-300"
                )}
              >
                {index + 1}
              </div>
              <div className="text-sm font-medium mt-2 text-center">{step}</div>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "h-1 flex-1 mx-4",
                  index < currentStep ? "bg-blue-600" : "bg-gray-300"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Stepper;
