import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import get from 'lodash/get';
import currency from 'currency.js';
import { rhythm, scale } from '../utils/typography';
import getPreviousEvenDollar from '../utils/get-previous-even-dollar';
import toCurrency from '../utils/to-currency';
import toNumber from '../utils/to-number';
import Layout from '../components/layout';
import NumericInput from '../components/numeric-input';
import DecrementButton from '../components/decrement-button';
import IncrementButton from '../components/increment-button';
import Content from '../styles/content';
import BrandButton from '../styles/brand-button';
import { useDefaultTipPercent, useDefaultPartySize } from '../utils/state';
import {
  initialDefaultTipPercent,
  initialDefaultPartySize,
} from '../utils/defaults';

const CalcGrid = styled.section`
  flex: 1;
  width: 100%;
  font-size: ${scale(0.25).fontSize};
  line-height: ${scale(0.25).lineHeight};
  display: grid;
  grid-row-gap: ${rhythm(2)};
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'tip-percent-label tip-percent-input'
    'tip-amount-label tip-amount-input'
    'total-amount-label total-amount-input'
    'number-of-people-label number-of-people-input'
    'each-person-pays-label each-person-pays-input';
  margin-bottom: ${rhythm(2)};
`;

const CalcInput = styled(NumericInput)`
  margin-left: ${rhythm(0.25)};
  margin-right: ${rhythm(0.25)};
  font-size: ${scale(0.25).fontSize};
  line-height: ${scale(0.25).lineHeight};
`;

const Cell = styled.div`
  display: flex;
  align-items: center;
`;

const HeroCell = styled(Cell)`
  border-style: solid;
  border-left: 0;
  border-right: 0;
  border-top-width: ${rhythm(0.05)};
  border-bottom-width: ${rhythm(0.05)};
  font-weight: 600;
  padding: ${rhythm(1.5)} 0;
`;

enum ActionType {
  CHANGE_TIP_PERCENT,
  CHANGE_TIP_AMOUNT,
  CHANGE_TOTAL_AMOUNT,
  CHANGE_NUMBER_OF_PEOPLE,
  CHANGE_EACH_PERSON_PAYS,
}

interface ChangeTipPercent {
  type: ActionType.CHANGE_TIP_PERCENT;
  payload: number;
}

interface ChangeTipAmount {
  type: ActionType.CHANGE_TIP_AMOUNT;
  payload: number;
}

interface ChangeTotalAmount {
  type: ActionType.CHANGE_TOTAL_AMOUNT;
  payload: number;
}

interface ChangeNumberOfPeople {
  type: ActionType.CHANGE_NUMBER_OF_PEOPLE;
  payload: number;
}

interface ChangeEachPersonPays {
  type: ActionType.CHANGE_EACH_PERSON_PAYS;
  payload: number;
}

type Action =
  | ChangeTipPercent
  | ChangeTipAmount
  | ChangeTotalAmount
  | ChangeNumberOfPeople
  | ChangeEachPersonPays;

interface State {
  tipPercent: number;
  tipAmount: number;
  totalAmount: number;
  numberOfPeople: number;
  eachPersonPays: number;
}

const CalcPage: React.FunctionComponent<
  import('reach__router').RouteComponentProps
> = ({ location, navigate }) => {
  const [defaultPartySize] = useDefaultPartySize(initialDefaultPartySize);
  const [defaultTipPercent] = useDefaultTipPercent(initialDefaultTipPercent);

  const billAmount = get(location, 'state.bill', 0);
  const initialTipAmount = currency(billAmount)
    .multiply(defaultTipPercent)
    .divide(100).value;
  const initialTotalAmount = currency(billAmount).add(initialTipAmount).value;
  const initialEachPersonPays = currency(initialTotalAmount).distribute(
    defaultPartySize,
  )[0].value;

  const initialState: State = {
    tipPercent: defaultTipPercent,
    tipAmount: initialTipAmount,
    totalAmount: initialTotalAmount,
    numberOfPeople: defaultPartySize,
    eachPersonPays: initialEachPersonPays,
  };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case ActionType.CHANGE_TIP_PERCENT: {
        const tipAmount = currency(action.payload)
          .divide(100)
          .multiply(billAmount).value;
        const totalAmount = currency(billAmount).add(tipAmount).value;
        const eachPersonPays = currency(totalAmount).distribute(
          state.numberOfPeople,
        )[0].value;

        return {
          tipPercent: action.payload,
          tipAmount,
          totalAmount,
          numberOfPeople: state.numberOfPeople,
          eachPersonPays,
        };
      }

      case ActionType.CHANGE_TIP_AMOUNT: {
        const tipPercent = currency(action.payload)
          .divide(billAmount)
          .multiply(100).value;
        const totalAmount = currency(billAmount).add(action.payload).value;
        const eachPersonPays = currency(totalAmount).distribute(
          state.numberOfPeople,
        )[0].value;

        return {
          tipPercent,
          tipAmount: action.payload,
          totalAmount,
          numberOfPeople: state.numberOfPeople,
          eachPersonPays,
        };
      }

      case ActionType.CHANGE_TOTAL_AMOUNT: {
        const tipAmount = currency(action.payload).subtract(billAmount).value;
        const tipPercent = currency(tipAmount)
          .divide(billAmount)
          .multiply(100).value;
        const eachPersonPays = currency(action.payload).distribute(
          state.numberOfPeople,
        )[0].value;

        return {
          tipPercent,
          tipAmount,
          totalAmount: action.payload,
          numberOfPeople: state.numberOfPeople,
          eachPersonPays,
        };
      }

      case ActionType.CHANGE_NUMBER_OF_PEOPLE: {
        const eachPersonPays = currency(state.totalAmount).distribute(
          action.payload,
        )[0].value;

        return {
          ...state,
          numberOfPeople: action.payload,
          eachPersonPays,
        };
      }

      case ActionType.CHANGE_EACH_PERSON_PAYS: {
        const totalAmount = currency(action.payload).multiply(
          state.numberOfPeople,
        ).value;
        const tipAmount = currency(totalAmount).subtract(billAmount).value;
        const tipPercent = currency(tipAmount)
          .divide(billAmount)
          .multiply(100).value;

        return {
          tipPercent,
          tipAmount,
          totalAmount,
          numberOfPeople: state.numberOfPeople,
          eachPersonPays: action.payload,
        };
      }
      default:
        throw new Error('Unrecognized state reducer action type!');
    }
  };

  const [state, dispatch] = React.useReducer(reducer, initialState);

  function startOver() {
    if (navigate) {
      navigate('/', { replace: true });
    }
  }

  return (
    <Layout>
      <Content>
        <CalcGrid>
          <Cell
            css={css`
              grid-area: tip-percent-label;
            `}
          >
            <label htmlFor="tip-percent">Tip Percent (%)</label>
          </Cell>
          <Cell
            css={css`
              grid-area: tip-percent-input;
            `}
          >
            <DecrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_TIP_PERCENT,
                  payload: state.tipPercent < 1 ? 0 : state.tipPercent - 1,
                });
              }}
            />
            <CalcInput
              id="tip-percent"
              name="tip-percent"
              value={state.tipPercent}
              onChange={e => {
                dispatch({
                  type: ActionType.CHANGE_TIP_PERCENT,
                  payload: toNumber(e.target.value),
                });
              }}
            />
            <IncrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_TIP_PERCENT,
                  payload: state.tipPercent + 1,
                });
              }}
            />
          </Cell>
          <Cell
            css={css`
              grid-area: tip-amount-label;
            `}
          >
            <label htmlFor="tip-amount">Tip Amount</label>
          </Cell>
          <Cell
            css={css`
              grid-area: tip-amount-input;
            `}
          >
            <DecrementButton
              onClick={() => {
                const current = currency(state.tipAmount, { increment: 1 });
                const previousEvenDollar = getPreviousEvenDollar(current);
                dispatch({
                  type: ActionType.CHANGE_TIP_AMOUNT,
                  payload: current.value < 1 ? 0 : previousEvenDollar,
                });
              }}
            />
            <CalcInput
              id="tip-amount"
              name="tip-amount"
              value={currency(state.tipAmount).format()}
              onChange={e => {
                dispatch({
                  type: ActionType.CHANGE_TIP_AMOUNT,
                  payload: toNumber(toCurrency(e.target.value)),
                });
              }}
            />
            <IncrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_TIP_AMOUNT,
                  payload: currency(state.tipAmount, { increment: 1 })
                    .add(1)
                    .dollars(),
                });
              }}
            />
          </Cell>
          <HeroCell
            css={css`
              grid-area: total-amount-label;
            `}
          >
            <label htmlFor="total-amount">Total Amount</label>
          </HeroCell>
          <HeroCell
            css={css`
              grid-area: total-amount-input;
            `}
          >
            <DecrementButton
              onClick={() => {
                const current = currency(state.totalAmount, { increment: 1 });
                const previousEvenDollar = getPreviousEvenDollar(current);
                dispatch({
                  type: ActionType.CHANGE_TOTAL_AMOUNT,
                  payload:
                    previousEvenDollar < billAmount
                      ? billAmount
                      : previousEvenDollar,
                });
              }}
            />
            <CalcInput
              css={css`
                font-weight: 600;
              `}
              id="total-amount"
              name="total-amount"
              value={currency(state.totalAmount).format()}
              onChange={e => {
                dispatch({
                  type: ActionType.CHANGE_TOTAL_AMOUNT,
                  // TODO: deal with manually setting below billAmount
                  payload: toNumber(toCurrency(e.target.value)),
                });
              }}
            />
            <IncrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_TOTAL_AMOUNT,
                  payload: currency(state.totalAmount, { increment: 1 })
                    .add(1)
                    .dollars(),
                });
              }}
            />
          </HeroCell>
          <Cell
            css={css`
              grid-area: number-of-people-label;
            `}
          >
            <label htmlFor="number-of-people">Number of People</label>
          </Cell>
          <Cell
            css={css`
              grid-area: number-of-people-input;
            `}
          >
            <DecrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_NUMBER_OF_PEOPLE,
                  payload:
                    state.numberOfPeople < 2 ? 1 : state.numberOfPeople - 1,
                });
              }}
            />
            <CalcInput
              id="number-of-people"
              name="number-of-people"
              value={state.numberOfPeople}
              onChange={e => {
                dispatch({
                  type: ActionType.CHANGE_NUMBER_OF_PEOPLE,
                  // TODO: deal with manually setting to 0
                  payload: toNumber(e.target.value),
                });
              }}
            />
            <IncrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_NUMBER_OF_PEOPLE,
                  payload: state.numberOfPeople + 1,
                });
              }}
            />
          </Cell>
          <Cell
            css={css`
              grid-area: each-person-pays-label;
            `}
          >
            <label htmlFor="each-person-pays">Each Person Pays</label>
          </Cell>
          <Cell
            css={css`
              grid-area: each-person-pays-input;
            `}
          >
            <DecrementButton
              onClick={() => {
                const current = currency(state.eachPersonPays, {
                  increment: 1,
                });
                const previousEvenDollar = getPreviousEvenDollar(current);
                const minPerPerson = currency(billAmount).distribute(
                  state.numberOfPeople,
                )[0].value;
                dispatch({
                  type: ActionType.CHANGE_EACH_PERSON_PAYS,
                  payload:
                    previousEvenDollar < minPerPerson
                      ? minPerPerson
                      : previousEvenDollar,
                });
              }}
            />
            <CalcInput
              id="each-person-pays"
              name="each-person-pays"
              value={currency(state.eachPersonPays).format()}
              onChange={e => {
                dispatch({
                  type: ActionType.CHANGE_EACH_PERSON_PAYS,
                  // TODO: deal with manually setting below minPerPerson
                  payload: toNumber(toCurrency(e.target.value)),
                });
              }}
            />
            <IncrementButton
              onClick={() => {
                dispatch({
                  type: ActionType.CHANGE_EACH_PERSON_PAYS,
                  payload: currency(state.eachPersonPays, { increment: 1 })
                    .add(1)
                    .dollars(),
                });
              }}
            />
          </Cell>
        </CalcGrid>
        <BrandButton type="button" onClick={startOver}>
          Start Over
        </BrandButton>
      </Content>
    </Layout>
  );
};

export default CalcPage;
