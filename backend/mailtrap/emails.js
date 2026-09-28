import {PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE} from "./emailTemplates.js"
import { client, sender, recipients } from "./mailtrap.config.js"

export const sendVerificationEmail = async (email,verificationToken)=>{
  const recipient = [{email}];

  try{
    const response = await client.send({
      from:sender,
      to:recipients,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationToken),
      category: "Email verification",
    })

    console.log("Email send successfully", response);
  }catch(error){
    console.error(`Error sending verification`,error);
    throw new Error(`Error sending verification email ${error}`);
  }
};

export const sendWelcomeEmail = async (email,name)=>{
  const recipient = [{email}];

  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      template_uuid:"db833fd9-1fa4-481b-8d3b-d465e416e6bf",
      template_variables:{
        company_info_name:"Famuca Co.",
        name: name,
      }
    })
  } catch (error) {
    console.error(`Error sending welcome email`,error);
    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendPasswordResetEmail = async(email,resetURL)=>{
  const recipient = [{email}];

  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Reset your password.",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}",resetURL),
      category: "Password Reset",
    })
  } catch (error) {
    console.error(`Error sending password reset email`, error);
    throw new Error(`Error sending password reset email: ${error}`);
  }
};

export const sendResetSuccessEmail = async(email)=>{
  const recipients = [{email}];
  
  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Password Reset Sucessfully!",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    })

    console.log("Password reset email sent successfully.");
  } catch (error) {
    console.error(`Error sending password reset sucess email:`, error);
    throw new Error(`Error sending password reset sucess email: ${error}`);    
  }
};