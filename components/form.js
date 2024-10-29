// PaymentForm.js
'use client'
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePaystackPayment } from 'react-paystack';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Paystack config
  const config = {
    reference: new Date().getTime().toString(),
    email: "customer@example.com", // You might want to add email to your form
    amount: formData.amount * 100, // Paystack amount is in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Function to save transaction to Supabase
  const saveTransaction = async (status = 'pending') => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            amount: parseFloat(formData.amount),
            status: status,
            reference: config.reference,
          }
        ]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  };

  // Function to update transaction status
  const updateTransactionStatus = async (reference, status) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ status: status })
        .match({ reference: reference });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  // Paystack success callback
  const onSuccess = async (reference) => {
    try {
      await updateTransactionStatus(config.reference, 'successful');
      alert('Payment successful!');
    } catch (error) {
      console.log(error)
      setError('Error updating payment status');
    }
  };

  // Paystack close callback
  const onClose = async () => {
    try {
      await updateTransactionStatus(config.reference, 'cancelled');
    } catch (error) {
      setError('Error updating payment status');
    }
  };

  // Initialize Paystack payment
  const initializePayment = usePaystackPayment(config);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Save initial transaction record
      await saveTransaction();
      
      // Initialize Paystack payment
      initializePayment(onSuccess, onClose);
    } catch (error) {
      setError('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Payment Form</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
            Full Name
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
            Phone Number
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </label>
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">
            Amount (NGN)
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="100"
              className="w-full p-2 border rounded mt-1"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded text-white font-medium 
            ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;