import { useState, useRef, useEffect } from 'react';

const AutocompleteSearch = ({ items, onSelect, placeholder = "Search items..." }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Filter items based on search term
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    const handleSelectItem = (item) => {
        onSelect(item);
        setSearchTerm('');
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen && e.key !== 'Escape') {
            setIsOpen(true);
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredItems.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && filteredItems[selectedIndex]) {
                    handleSelectItem(filteredItems[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <input
                ref={inputRef}
                type="text"
                className="input-field"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
            />

            {/* Dropdown */}
            {isOpen && filteredItems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredItems.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                                    ? 'bg-primary-100 dark:bg-primary-900'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                        {item.name}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        ${item.price.toFixed(2)}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${item.category === 'KOT'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }`}>
                                    {item.category}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No results */}
            {isOpen && searchTerm && filteredItems.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-center">No items found</p>
                </div>
            )}
        </div>
    );
};

export default AutocompleteSearch;
