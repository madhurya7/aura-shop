
-- Allow users to delete their own orders ONLY when pending
CREATE POLICY "Users can delete own pending orders"
  ON public.orders FOR DELETE
  USING (auth.uid() = user_id AND order_status = 'pending');

-- Allow deleting order_items for pending orders (cascade needs this)
CREATE POLICY "Users can delete own pending order items"
  ON public.order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid() AND orders.order_status = 'pending'
  ));

-- Allow deleting payments for pending orders
CREATE POLICY "Users can delete payments for own pending orders"
  ON public.payments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id AND orders.user_id = auth.uid() AND orders.order_status = 'pending'
  ));
