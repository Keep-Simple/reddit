import { Box, Button, Flex, Link } from "@chakra-ui/core";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery({ pause: isServer() });
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  let body;

  if (fetching) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="login">
          <Link mr={2}>login</Link>
        </NextLink>
        <NextLink href="register">
          <Link>register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button
          onClick={() => logout()}
          isLoading={logoutFetching}
          variant="link"
        >
          logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex p={4} bg="tan">
      <Box ml={"auto"}></Box>
      {body}
    </Flex>
  );
};
