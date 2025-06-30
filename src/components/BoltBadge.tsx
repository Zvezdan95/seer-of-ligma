import { useState } from 'react';

// The interface is empty, which is fine if no props are needed.
interface BoltBadgeProps { }

const BoltBadge = ({ }: BoltBadgeProps) => {
    // 1. Add state to track if the animation has ended
    const [animationHasEnded, setAnimationHasEnded] = useState(false);

    // 2. Create a handler function to update the state
    const handleAnimationEnd = () => {
        setAnimationHasEnded(true);
    };

    // 3. Conditionally build the className string
    const badgeClasses = [
        "h-8 md:h-10",
        "w-auto",
        "shadow-lg",
        "opacity-90 hover:opacity-100",
        "bolt-badge bolt-badge-intro",
        // Add the 'animated' class only after the initial animation ends
        animationHasEnded ? "animated" : ""
    ].join(" ");


    return (
        <div className="fixed bottom-4 right-4 z-50">
            <a href="https://bolt.new/?rid=os72mi" target="_blank" rel="noopener noreferrer"
                className="block transition-all duration-300 hover:shadow-2xl">
                <img
                    src="https://storage.bolt.army/logotext_poweredby_360w.png"
                    alt="Powered by Bolt.new badge"
                    // 4. Use the dynamic className and the correct React event handler
                    className={badgeClasses}
                    onAnimationEnd={handleAnimationEnd}
                />
            </a>
        </div>
    )
}

export default BoltBadge;