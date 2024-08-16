import RegisterForm from "../../../components/register-form";

export default async function SignUpPage() {
  return (
    <div className="p-10 flex flex-col gap-4 h-[100vh] overflow-hidden">
      <div className="flex gap-4">
        <div className="flex flex-col w-[500px] gap-4">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
