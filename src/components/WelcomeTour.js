'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeTour({ role }) {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has seen the tour before
    const tourSeen = localStorage.getItem(`welcomeTour_${role}`);
    if (!tourSeen && user) {
      setShowTour(true);
    }
  }, [role, user]);

  // Define different tour steps based on user role
  const getTourSteps = () => {
    const commonSteps = [
      {
        title: "Welcome to Campus Connect!",
        description: "Let's take a quick tour to help you get started with the platform.",
        target: "body"
      }
    ];

    const roleSpecificSteps = {
      student: [
        {
          title: "Your Dashboard",
          description: "This is your student dashboard where you can view your enrolled classes, check attendance, and access learning materials.",
          target: ".student-dashboard"
        },
        {
          title: "Join Classes",
          description: "You can easily join your classes by entering the class ID provided by your instructor.",
          target: ".join-class-form"
        },
        {
          title: "Library Access",
          description: "Browse and borrow books from our digital library catalog.",
          target: ".library-access"
        }
      ],
      faculty: [
        {
          title: "Faculty Dashboard",
          description: "Manage your classes, track attendance, and create announcements for your students.",
          target: ".faculty-dashboard"
        },
        {
          title: "Assigned Classes",
          description: "View and manage all classes assigned to you.",
          target: ".assigned-classes"
        },
        {
          title: "Create Announcements",
          description: "Keep your students informed with important announcements.",
          target: ".announcements-section"
        }
      ],
      hod: [
        {
          title: "Department Head Dashboard",
          description: "Manage your department's faculty, courses, and resources from this central dashboard.",
          target: ".hod-dashboard"
        },
        {
          title: "Teacher Management",
          description: "Review and approve faculty requests and manage teacher assignments.",
          target: ".teacher-management"
        },
        {
          title: "College Setup",
          description: "Configure your college's departments, courses, and administrative settings.",
          target: ".college-setup"
        }
      ],
      admin: [
        {
          title: "Admin Dashboard",
          description: "Oversee the entire platform, manage colleges, and handle system-wide settings.",
          target: ".admin-dashboard"
        },
        {
          title: "College Management",
          description: "Add, edit, and manage colleges registered on the platform.",
          target: ".college-management"
        }
      ]
    };

    return [...commonSteps, ...(roleSpecificSteps[role] || [])];
  };

  const steps = getTourSteps();

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem(`welcomeTour_${role}`, 'seen');
    setShowTour(false);
    setTourCompleted(true);
  };

  const skipTour = () => {
    localStorage.setItem(`welcomeTour_${role}`, 'seen');
    setShowTour(false);
  };

  if (!showTour) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-indigo-700">
            {steps[currentStep].title}
          </h3>
          <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700">{steps[currentStep].description}</p>
        </div>
        
        <div className="flex justify-between">
          <div>
            <button 
              onClick={skipTour}
              className="text-gray-500 hover:text-gray-700 text-sm mr-4"
            >
              Skip Tour
            </button>
            {currentStep > 0 && (
              <button 
                onClick={handlePrevStep}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Previous
              </button>
            )}
          </div>
          <button
            onClick={handleNextStep}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            {currentStep < steps.length - 1 ? "Next" : "Finish Tour"}
          </button>
        </div>
      </div>
    </div>
  );
}