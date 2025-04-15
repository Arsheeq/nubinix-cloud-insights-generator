
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StepProps {
  steps: string[];
  currentStep: number;
}

const stepVariants = {
  inactive: { scale: 1, opacity: 0.8 },
  active: { 
    scale: 1.1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  completed: { scale: 1, opacity: 1 }
};

const lineVariants = {
  inactive: { 
    background: "var(--bg-gray-300)",
    transition: { duration: 0.5 }
  },
  active: { 
    background: "var(--bg-blue-600)",
    transition: { duration: 0.5 }
  }
};

export function Stepper({ steps, currentStep }: StepProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <motion.div 
              className="flex flex-col items-center"
              initial="inactive"
              animate={
                index < currentStep 
                  ? "completed" 
                  : index === currentStep 
                  ? "active" 
                  : "inactive"
              }
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-300", 
                  index < currentStep 
                    ? "bg-blue-600" 
                    : index === currentStep 
                    ? "bg-blue-500" 
                    : "bg-gray-300"
                )}
                variants={stepVariants}
              >
                {index + 1}
              </motion.div>
              <motion.div 
                className="text-sm font-medium mt-2 text-center"
                variants={{
                  inactive: { opacity: 0.7 },
                  active: { opacity: 1, fontWeight: 600 },
                  completed: { opacity: 1 }
                }}
              >
                {step}
              </motion.div>
            </motion.div>
            
            {index < steps.length - 1 && (
              <motion.div 
                className={cn(
                  "h-1 flex-1 mx-4",
                  index < currentStep ? "bg-blue-600" : "bg-gray-300"
                )}
                variants={lineVariants}
                initial="inactive"
                animate={index < currentStep ? "active" : "inactive"}
                style={{ 
                  backgroundColor: index < currentStep ? "rgb(37, 99, 235)" : "rgb(209, 213, 219)"
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Stepper;
