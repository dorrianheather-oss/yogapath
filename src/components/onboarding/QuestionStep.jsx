import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function QuestionStep({ question, options, selected, onSelect, step, total, multiSelect }) {
  return (
    <motion.div
      key={question}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-6 pt-16 pb-8"
    >
      {/* Progress */}
      <div className="flex gap-1.5 mb-10">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full flex-1 transition-all duration-500",
              i <= step ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-2">{question}</h2>
      {multiSelect && (
        <p className="text-sm text-muted-foreground mb-6">Select all that apply</p>
      )}

      <div className="space-y-3 mt-8">
        {options.map((option) => {
          const isSelected = multiSelect
            ? (selected || []).includes(option.value)
            : selected === option.value;

          return (
            <motion.button
              key={option.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.value)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white hover:border-primary/30"
              )}
            >
              {option.icon && <span className="text-2xl">{option.icon}</span>}
              <div className="flex-1">
                <p className="font-semibold text-sm">{option.label}</p>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                )}
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}