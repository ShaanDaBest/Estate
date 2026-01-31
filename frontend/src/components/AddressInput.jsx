import { useState, useEffect, useCallback } from "react";
import { MapPin, Search, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import debounce from "@/utils/debounce";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AddressInput = ({ 
  value, 
  onChange, 
  onValidated,
  placeholder = "Enter address",
  className = "",
  ...props 
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Debounced search function
  const searchAddress = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `${API}/geocode/search?query=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Address search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValidated(false);
    setValidationError(null);
    onChange?.(newValue);
    searchAddress(newValue);
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.display_name);
    onChange?.(suggestion.display_name);
    setIsValidated(true);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Pass coordinates to parent
    onValidated?.({
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || "",
    });
  };

  const handleValidateAddress = async () => {
    if (!inputValue) return;
    
    setIsSearching(true);
    setValidationError(null);
    
    try {
      const response = await fetch(
        `${API}/geocode/validate?address=${encodeURIComponent(inputValue)}`
      );
      const data = await response.json();
      
      if (data.valid && data.result) {
        setIsValidated(true);
        onValidated?.({
          address: data.result.display_name,
          latitude: data.result.latitude,
          longitude: data.result.longitude,
          city: data.result.city || "",
        });
      } else {
        setValidationError("Address not found. Please check and try again.");
        setIsValidated(false);
      }
    } catch (error) {
      setValidationError("Failed to validate address");
      setIsValidated(false);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin 
            size={16} 
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isValidated ? "text-emerald-500" : "text-neutral-400"
            }`} 
          />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={`pl-10 pr-10 ${className}`}
            {...props}
          />
          {isSearching && (
            <Loader2 
              size={16} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 animate-spin" 
            />
          )}
          {isValidated && !isSearching && (
            <Check 
              size={16} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" 
            />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleValidateAddress}
          disabled={isSearching || !inputValue}
          className="shrink-0"
          data-testid="validate-address-btn"
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </Button>
      </div>

      {/* Validation error */}
      {validationError && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <X size={12} />
          {validationError}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
              data-testid={`address-suggestion-${idx}`}
            >
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#D3AF37] mt-0.5 shrink-0" />
                <span className="line-clamp-2">{suggestion.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Validated indicator */}
      {isValidated && (
        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
          <Check size={12} />
          Address validated
        </p>
      )}
    </div>
  );
};

export default AddressInput;
