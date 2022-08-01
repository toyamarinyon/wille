import { inferEagleSession, PageHandler, PageProps } from "@toyamarinyon/eagle";
import { useState } from "react";
import { app } from "..";

function AnotherComponent() {
  return <h1>Hello!</h1>;
}

export const pageProps: PageProps<inferEagleSession<typeof app>> = async ({
  session,
}) => {
  const username = session.userId ?? "guest";
  return {
    message: username,
  };
};

export default function HelloWorld(props: Record<string, any>) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <AnotherComponent />
      {props.message}! Satoshi!
      <button
        onClick={() => {
          console.log("hello");
          setCount(count + 1);
        }}
      >
        click
      </button>
      <p>count: {count}</p>
    </div>
  );
}
