
import React from 'react';

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <div className="h-full w-full overflow-y-auto">{children}</div>
    </div>
  );
});
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
