import * as React from "react";
import { gql } from "apollo-boost";
import { useSubscription, useMutation } from "@apollo/react-hooks";
import { Context } from "../Context";
import Icon from "../_lib/Icon";

import "./ColumnCard.css";

type CardProps = {
    id: string
    type: string
    userId?: string
    initialText?: string
};

const CARD_UPDATED_SUBSCRIPTION = gql`
    subscription onCardUpdated($type: String!, $id: String!) {
        cardUpdated(type: $type, id: $id) {
            content
        }
    }
`;

const DELETE_CARD_MUTATION = gql`
    mutation DeleteCard($id: String!) {
        deleteCard(id: $id)
    }
`;

export default function ColumnCard({ id, userId, type, initialText = '' }: CardProps) {
    // We get the current user ID from the localStorage, which
    // was set when the user logged in. We will use that to blur
    // cards that don't belong to the current user
    const belongsToUser = React.useMemo(() => !userId || userId === localStorage.getItem("userId"), [userId]);

    // We also need the current step, in order to know whether
    // we're ready to reveal the cards to all users
    const { currentStep } = React.useContext(Context);
    const blurred = currentStep < 2;

    // Everytime we get an update for this card in particular, we
    // will update this state. Note from the subscription that we're
    // sending the ID of the card as a variable; that is because we
    // will filter on the server to make sure that we're only notified
    // for updates on _this_ card
    const [text, setText] = React.useState(initialText);

    // Here we subscribe to updates on the card
    const { data } = useSubscription(CARD_UPDATED_SUBSCRIPTION, { variables: { type, id } });

    const [deleteCard] = useMutation(DELETE_CARD_MUTATION, { variables: { id } });

    React.useEffect(() => {
        if (data) {
            setText(data.cardUpdated.content);
        }
    }, [data]);

    if (initialText.length === 0 && !data) {
        return null;
    }

    const shuffledText = belongsToUser
        ? text
        : (
            Array.from(text).map(char => (
                [' ', '.', '!'].includes(char) ? char : String.fromCharCode(char.charCodeAt(0) + 2)
            )).join('')
        );

    return (
        <div key={id} className={`card${!belongsToUser && blurred ? ' blurry' : ''}`}>
            {belongsToUser && (
                <button className="card-delete" style={{ backgroundColor: "transparent", border: "none" }} onClick={() => deleteCard()}>
                    <Icon name="trash" />
                </button>
            )}
            <div className="tag">{type}</div>
            <div style={{ paddingTop: 10, wordBreak: "break-word" }}>{blurred ? shuffledText : text}</div>
        </div>
    );
}
