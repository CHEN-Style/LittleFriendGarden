import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Sparkles, Clock, Footprints } from "lucide-react";
import { Progress } from "./ui/progress";
import { useState, TouchEvent } from "react";

interface Pet {
  petImage: string;
  name: string;
  breed: string;
  age: string;
  goalsCompleted: number;
  goalsTotal: number;
  nextTask?: {
    title: string;
    time: string;
    icon?: any;
  };
}

interface PetProfileProps {
  pets: Pet[];
}

export function PetProfile({ pets }: PetProfileProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    setDragOffset(currentTouch - touchStart);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < pets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setIsDragging(false);
    setDragOffset(0);
  };

  if (pets.length === 0) {
    return null;
  }

  // Calculate transform for the carousel
  const cardWidth = 85; // percentage of container width for each card
  const gap = 3; // gap between cards in percentage
  const baseTransform = -currentIndex * (cardWidth + gap);
  const dragTransformPercent = isDragging ? (dragOffset / window.innerWidth) * 100 : 0;
  const totalTransform = baseTransform + dragTransformPercent;

  return (
    <div className="relative -mx-3">
      <div 
        className="overflow-visible px-3"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex gap-[3%] transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(7.5% + ${totalTransform}%))`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {pets.map((pet, index) => {
            const TaskIcon = pet?.nextTask?.icon || Footprints;
            const goalsProgress = (pet.goalsCompleted / pet.goalsTotal) * 100;
            const isActive = index === currentIndex;
            const distance = Math.abs(index - currentIndex);

            return (
              <div
                key={index}
                className="flex-shrink-0 transition-all duration-300"
                style={{
                  width: '85%',
                  opacity: distance > 1 ? 0.3 : distance === 1 ? 0.6 : 1,
                  transform: `scale(${isActive ? 1 : 0.9})`,
                  filter: isActive ? 'none' : 'brightness(0.8)',
                }}
              >
                <div className="bg-orange-500 dark:bg-transparent rounded-lg p-4 text-white shadow-lg border-2 border-transparent dark:border-orange-500">
                  {/* Top Section: Pet Info (left) + Daily Goals (right) */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Pet Info - Left */}
                    <div className="flex items-start gap-3 flex-[2]">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/30 dark:border-orange-500/50">
                          <ImageWithFallback 
                            src={pet.petImage}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 dark:bg-orange-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h2 className="text-white dark:text-gray-100 mb-0.5">{pet.name}</h2>
                        <p className="text-orange-100 dark:text-gray-400 text-sm mb-0.5">{pet.breed}</p>
                        <p className="text-orange-100 dark:text-gray-400 text-xs">{pet.age} old</p>
                      </div>
                    </div>

                    {/* Daily Goals - Right */}
                    <div className="bg-white/10 dark:bg-orange-500/10 backdrop-blur-sm rounded-lg p-2 flex-[1] flex flex-col justify-center border border-transparent dark:border-orange-500/30">
                      <p className="text-xs text-orange-100 dark:text-gray-400 mb-1 text-center">Daily Goals</p>
                      <p className="text-white dark:text-gray-100 text-center mb-1.5">{pet.goalsCompleted}/{pet.goalsTotal}</p>
                      <Progress value={goalsProgress} className="h-1.5 bg-white/20 dark:bg-gray-700" />
                    </div>
                  </div>

                  {/* Bottom Section: Next Task */}
                  {pet.nextTask && (
                    <div className="bg-white/20 dark:bg-orange-500/10 backdrop-blur-sm rounded-lg p-3 border border-transparent dark:border-orange-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/30 dark:bg-orange-500/20 rounded-lg flex items-center justify-center border border-transparent dark:border-orange-500/30">
                          <TaskIcon className="w-4 h-4 text-white dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-orange-100 dark:text-gray-400 mb-0.5">Next Task</p>
                          <p className="text-white dark:text-gray-100 text-sm">{pet.nextTask.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-orange-100 dark:text-gray-400" />
                            <p className="text-xs text-orange-100 dark:text-gray-400">{pet.nextTask.time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicator Dots */}
      {pets.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {pets.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-6 bg-orange-500 dark:bg-orange-400' 
                  : 'w-1.5 bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={`Go to pet ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
