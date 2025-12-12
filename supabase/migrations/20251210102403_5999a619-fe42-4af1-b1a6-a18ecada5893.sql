-- Create a function to validate and process bids atomically
CREATE OR REPLACE FUNCTION public.validate_and_process_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_highest_bid numeric;
  auction_min_increment numeric;
  auction_starting_price numeric;
  auction_status text;
  auction_approval_status text;
  required_minimum numeric;
BEGIN
  -- Get auction details with row lock to prevent concurrent modifications
  SELECT current_bid, minimum_increment, starting_price, status, approval_status
  INTO current_highest_bid, auction_min_increment, auction_starting_price, auction_status, auction_approval_status
  FROM auctions
  WHERE id = NEW.auction_id
  FOR UPDATE;
  
  -- Check if auction exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  
  -- Check if auction is active
  IF auction_status != 'active' THEN
    RAISE EXCEPTION 'Auction is not active';
  END IF;
  
  -- Check if auction is approved
  IF auction_approval_status != 'approved' THEN
    RAISE EXCEPTION 'Auction is not approved';
  END IF;
  
  -- Calculate required minimum bid
  IF current_highest_bid > 0 THEN
    required_minimum := current_highest_bid + auction_min_increment;
  ELSE
    required_minimum := auction_starting_price;
  END IF;
  
  -- Validate bid amount
  IF NEW.bid_amount < required_minimum THEN
    RAISE EXCEPTION 'Bid amount must be at least %', required_minimum;
  END IF;
  
  -- Update the auction's current bid atomically
  UPDATE auctions
  SET current_bid = NEW.bid_amount,
      updated_at = now()
  WHERE id = NEW.auction_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bids table
DROP TRIGGER IF EXISTS validate_bid_before_insert ON bids;
CREATE TRIGGER validate_bid_before_insert
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_and_process_bid();